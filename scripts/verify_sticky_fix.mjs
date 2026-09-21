import { chromium } from 'playwright';

async function verifyStickyFix() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  
  const testCases = [
    { width: 360, height: 740, name: 'android_compact' },
    { width: 375, height: 812, name: 'iphone_13_mini' },
    { width: 390, height: 844, name: 'iphone_14' },
    { width: 414, height: 896, name: 'iphone_plus' },
    { width: 768, height: 1024, name: 'ipad_portrait' },
    { width: 1024, height: 768, name: 'ipad_landscape' },
    { width: 1440, height: 900, name: 'desktop_mac' },
  ];

  let allPassed = true;

  for (const tc of testCases) {
    const page = await browser.newPage({ viewport: { width: tc.width, height: tc.height } });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // 1. Initial state (top of page)
    const initialHeader = await page.evaluate(() => {
      const h = document.querySelector('.header-wrapper');
      return { height: h.offsetHeight, bottom: h.getBoundingClientRect().bottom };
    });

    // 2. Scroll down so category-sticky-bar is definitely stuck
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(300);

    const stickyState = await page.evaluate(() => {
      const header = document.querySelector('.header-wrapper');
      const catBar = document.querySelector('.category-sticky-bar');
      const firstPill = document.querySelector('.category-nav-item');
      
      const hRect = header.getBoundingClientRect();
      const cRect = catBar.getBoundingClientRect();
      const pRect = firstPill ? firstPill.getBoundingClientRect() : null;

      const headerBottom = Math.round(hRect.bottom);
      const catTop = Math.round(cRect.top);
      const pillTop = pRect ? Math.round(pRect.top) : 0;
      const overlap = headerBottom - catTop;
      const pillOverlap = pRect ? headerBottom - pillTop : 0;

      return {
        headerHeight: header.offsetHeight,
        headerBottom,
        catTop,
        catBottom: Math.round(cRect.bottom),
        overlap,
        pillTop,
        pillOverlap,
        cssHeaderHeightVar: getComputedStyle(document.documentElement).getPropertyValue('--header-height'),
      };
    });

    // Check pass/fail: catTop MUST be >= headerBottom - 1 (allowing 1px rounding tolerance)
    const passed = stickyState.overlap <= 0;
    if (!passed) allPassed = false;

    console.log(
      `[${passed ? 'PASS' : 'FAIL'}] ${tc.name} (${tc.width}px): ` +
      `HeaderBottom=${stickyState.headerBottom}px, CatTop=${stickyState.catTop}px, ` +
      `Overlap=${stickyState.overlap}px, PillTop=${stickyState.pillTop}px, var=${stickyState.cssHeaderHeightVar}`
    );

    // Save screenshot of sticky nav
    await page.screenshot({ path: `scripts/verified_${tc.name}.png` });
    await page.close();
  }

  await browser.close();
  console.log('\n--- OVERALL RESULT:', allPassed ? 'ALL VIEWPORTS PASSED!' : 'SOME FAILED!');
}

verifyStickyFix();
