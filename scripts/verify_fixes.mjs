import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/feofa/.gemini/antigravity-ide/brain/769d9b8f-0c26-4366-ba88-07bdebf5fce7';

async function verify() {
  console.log('Launching browser via Microsoft Edge...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Hero & Header screenshot (check separator dot and font)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'fix_1_hero_header.png') });
  console.log('Saved fix_1_hero_header.png');

  // 2. Catalog cards screenshot (check description truncation & card image fonts)
  const catalogEl = await page.$('#catalog');
  if (catalogEl) {
    await catalogEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'fix_2_catalog_cards.png') });
    console.log('Saved fix_2_catalog_cards.png');
  }

  // 3. Click "О мастере" in header and verify scroll + photo
  console.log('Testing "О мастере" nav link...');
  await page.click('a[href="#about"]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'fix_3_about_master.png') });
  console.log('Saved fix_3_about_master.png');

  // 4. Click "Доставка (4 км)" in header and verify scroll + delivery widget
  console.log('Testing "Доставка (4 км)" nav link...');
  await page.click('a[href="#delivery"]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'fix_4_delivery_section.png') });
  console.log('Saved fix_4_delivery_section.png');

  // 5. Click "Контакты" in header and verify scroll + footer
  console.log('Testing "Контакты" nav link...');
  await page.click('a[href="#contacts"]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'fix_5_contacts_footer.png') });
  console.log('Saved fix_5_contacts_footer.png');

  // 6. Test distance checker in delivery section
  const addressInput = await page.$('input[placeholder*="Бурцево"]');
  if (addressInput) {
    await addressInput.fill('д. Бурцево, ул. Раздолье, 10');
    await page.click('button:has-text("Проверить")');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'fix_6_delivery_checked.png') });
    console.log('Saved fix_6_delivery_checked.png');
  }

  await browser.close();
  console.log('All verifications completed successfully!');
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
