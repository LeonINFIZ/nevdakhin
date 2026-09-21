import { chromium } from 'playwright';

async function checkMobile() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const viewports = [
    { width: 375, height: 812, name: 'iphone13' },
    { width: 390, height: 844, name: 'iphone14' },
    { width: 768, height: 1024, name: 'tablet_port' },
    { width: 1024, height: 768, name: 'tablet_land' },
    { width: 1440, height: 900, name: 'desktop' },
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Scroll down to where category bar is definitely stuck
    await page.evaluate(() => window.scrollTo(0, 1400));
    await page.waitForTimeout(200);

    const result = await page.evaluate(() => {
      const header = document.querySelector('.header-wrapper');
      const catBar = document.querySelector('.category-sticky-bar');
      const hRect = header.getBoundingClientRect();
      const cRect = catBar.getBoundingClientRect();
      const catComputedTop = window.getComputedStyle(catBar).top;
      return {
        headerHeight: header.offsetHeight,
        headerBottom: Math.round(hRect.bottom),
        catTop: Math.round(cRect.top),
        catHeight: catBar.offsetHeight,
        catComputedTop,
        overlap: Math.round(hRect.bottom - cRect.top),
      };
    });

    console.log(`[${vp.name} (${vp.width}px)] Header bottom: ${result.headerBottom}px, Cat top: ${result.catTop}px, Cat CSS: ${result.catComputedTop}, Overlap: ${result.overlap}px`);
    
    // Take screenshot around header + category
    await page.screenshot({ path: `scripts/shot_${vp.name}_overlap.png` });
    await page.close();
  }

  await browser.close();
}

checkMobile();
