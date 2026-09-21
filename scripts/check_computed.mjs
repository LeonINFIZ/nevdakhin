import { chromium } from 'playwright';

async function checkComputed() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  const info = await page.evaluate(() => {
    const el = document.querySelector('.category-sticky-bar');
    const header = document.querySelector('.header-wrapper');
    const cs = window.getComputedStyle(el);
    const hcs = window.getComputedStyle(header);
    return {
      barPosition: cs.position,
      barTop: cs.top,
      headerPosition: hcs.position,
      headerTop: hcs.top,
      headerHeight: header.offsetHeight,
      windowScrollY: window.scrollY
    };
  });
  console.log('Computed styles before scroll:', info);

  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(300);

  const infoAfter = await page.evaluate(() => {
    const el = document.querySelector('.category-sticky-bar');
    const header = document.querySelector('.header-wrapper');
    const cs = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const hRect = header.getBoundingClientRect();
    return {
      barTop: cs.top,
      barBoundingTop: rect.top,
      headerBoundingTop: hRect.top,
      headerBoundingBottom: hRect.bottom,
      windowScrollY: window.scrollY
    };
  });
  console.log('Computed styles after scroll:', infoAfter);
  await browser.close();
}

checkComputed();
