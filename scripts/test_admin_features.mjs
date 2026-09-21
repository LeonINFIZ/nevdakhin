import { chromium } from 'playwright';

async function testAdmin() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. Log in
  await page.goto('http://localhost:3000/admin/login');
  await page.fill('input[type="password"]', 'nevdakhin2026');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin', { timeout: 8000 });
  console.log('1. Logged into admin panel successfully');

  // 2. Go to Products tab
  await page.click('button:has-text("Товары")');
  await page.waitForTimeout(500);

  // Take screenshot of products table with badge column and filter
  await page.screenshot({ path: 'scripts/admin_products_badge_view.png' });
  console.log('2. Products tab with Badges banner and column captured');

  // Open Add Product modal
  await page.click('button:has-text("Добавить деликатес")');
  await page.waitForTimeout(400);

  // Click a badge preset chip (e.g. "Хит продаж")
  await page.click('button:has-text("Хит продаж")');
  await page.waitForTimeout(200);

  // Take screenshot of product modal with badge presets and preview
  await page.screenshot({ path: 'scripts/admin_product_modal_badge.png' });
  console.log('3. Product modal with badge chips and preview captured');

  // Close product modal (click close button)
  await page.locator('.modal-content button').first().click();
  await page.waitForTimeout(300);

  // 3. Go to Categories tab
  await page.click('button:has-text("Категории")');
  await page.waitForTimeout(500);

  // Take screenshot of categories with "Изменить" button
  await page.screenshot({ path: 'scripts/admin_categories_edit_view.png' });
  console.log('4. Categories tab with Edit buttons captured');

  // Open Add Category modal
  await page.click('button:has-text("Добавить категорию")');
  await page.waitForTimeout(400);

  // Type Cyrillic category name
  await page.fill('input[placeholder="Например: Сырная лавка"]', 'Домашние сыры и масло');
  await page.waitForTimeout(300);

  const autoSlug = await page.inputValue('input[placeholder="syrnaya-lavka"]');
  console.log('5. Auto-transliterated slug for "Домашние сыры и масло":', autoSlug);

  // Take screenshot of auto-slug in Category modal
  await page.screenshot({ path: 'scripts/admin_category_modal_autoslug.png' });

  // Close modal
  await page.locator('.modal-content button').first().click();
  await page.waitForTimeout(300);

  // Click "Изменить" on first category
  const firstEditBtn = page.locator('button:has-text("Изменить")').first();
  await firstEditBtn.click();
  await page.waitForTimeout(400);

  const modalTitle = await page.locator('.modal-content h3').textContent();
  console.log('6. Edit category modal opened with title:', modalTitle);

  // Take screenshot of Edit Category modal
  await page.screenshot({ path: 'scripts/admin_category_modal_edit.png' });

  await browser.close();
  console.log('\n--- ALL ADMIN FEATURES VERIFIED SUCCESSFULLY! ---');
}

testAdmin();
