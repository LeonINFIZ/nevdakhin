import { chromium } from 'playwright';

async function findOverflow() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  const overflows = await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const elements = document.querySelectorAll('*');
    const bad = [];
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (rect.right > docWidth + 1) {
        bad.push({
          tag: el.tagName,
          className: el.className,
          id: el.id,
          right: rect.right,
          width: rect.width,
          text: el.textContent?.slice(0, 40)
        });
      }
    }
    return bad;
  });

  console.log('Elements overflowing width 390px:', JSON.stringify(overflows, null, 2));
  await browser.close();
}

findOverflow();
