import { chromium } from 'playwright';

async function testMobileSticky() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); // iPhone 14
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Find the exact offset of .category-sticky-bar
  const barOffsetTop = await page.evaluate(() => {
    const el = document.querySelector('.category-sticky-bar');
    return el.offsetTop;
  });
  console.log('Category bar natural offsetTop:', barOffsetTop);

  // Test at several scroll positions:
  // 1. Natural flow before sticking
  // 2. Exact sticking point
  // 3. Deep inside product grid (1500px, 2000px, 3000px)
  const scrollPositions = [0, 500, barOffsetTop - 50, barOffsetTop + 100, barOffsetTop + 500, 2500];

  for (const scrollY of scrollPositions) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(150);

    const check = await page.evaluate(() => {
      const header = document.querySelector('.header-wrapper');
      const catBar = document.querySelector('.category-sticky-bar');
      const firstPill = document.querySelector('.category-nav-item');

      const hRect = header.getBoundingClientRect();
      const cRect = catBar.getBoundingClientRect();
      const pRect = firstPill.getBoundingClientRect();

      return {
        scrollY: window.scrollY,
        headerBottom: Math.round(hRect.bottom),
        catTop: Math.round(cRect.top),
        catBottom: Math.round(cRect.bottom),
        pillTop: Math.round(pRect.top),
        pillBottom: Math.round(pRect.bottom),
        overlapWithHeader: Math.round(hRect.bottom - cRect.top),
        pillOverlapWithHeader: Math.round(hRect.bottom - pRect.top),
      };
    });

    console.log(
      `ScrollY=${check.scrollY}px | HeaderBottom=${check.headerBottom}px | ` +
      `CatTop=${check.catTop}px | PillTop=${check.pillTop}px | ` +
      `Overlap=${check.overlapWithHeader}px | PillOverlap=${check.pillOverlapWithHeader}px`
    );
  }

  // Take a high-res screenshot while scrolled into the catalog
  await page.evaluate(() => window.scrollTo(0, 1800));
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'scripts/mobile_sticky_docked_390.png' });

  await browser.close();
}

testMobileSticky();
