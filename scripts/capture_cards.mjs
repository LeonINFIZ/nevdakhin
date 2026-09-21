import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/feofa/.gemini/antigravity-ide/brain/769d9b8f-0c26-4366-ba88-07bdebf5fce7';

async function captureCards() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Scroll so cards are clearly in view
  const grid = await page.$('.products-grid');
  if (grid) {
    await grid.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'fix_cards_detail.png') });
  }

  await browser.close();
}

captureCards();
