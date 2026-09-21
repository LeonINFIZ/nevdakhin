import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/feofa/.gemini/antigravity-ide/brain/769d9b8f-0c26-4366-ba88-07bdebf5fce7';

async function checkSticky() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  console.log('Scroll 0:');
  const headerRect0 = await page.$eval('.header-wrapper', el => el.getBoundingClientRect());
  console.log('Header rect at scroll 0:', headerRect0);

  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(500);

  const headerRect800 = await page.$eval('.header-wrapper', el => el.getBoundingClientRect());
  console.log('Header rect at scroll 800:', headerRect800);

  const stickyBarRect800 = await page.$eval('.category-sticky-bar', el => el.getBoundingClientRect());
  console.log('Category sticky bar rect at scroll 800:', stickyBarRect800);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_sticky_desktop.png') });
  await browser.close();
}

checkSticky();
