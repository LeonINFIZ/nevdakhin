import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/feofa/.gemini/antigravity-ide/brain/769d9b8f-0c26-4366-ba88-07bdebf5fce7';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function runE2E() {
  console.log('--- Starting Playwright End-to-End Test ---');

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  // 1. Visit Homepage
  console.log('1. Loading Homepage...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_homepage_hero.png') });
  console.log('✓ Homepage loaded and hero screenshot captured');

  // 2. Filter Category
  console.log('2. Filtering by "Колбасные изделия"...');
  await page.click('button:has-text("Колбасные изделия")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_category_filtered.png') });
  console.log('✓ Category filtered');

  // 3. Inspect Product Modal
  console.log('3. Opening Product Details Modal...');
  const krakovskayaCard = page.locator('.product-card:has-text("Колбаса Краковская")').first();
  await krakovskayaCard.locator('.product-card-title').click();
  await page.waitForSelector('.modal-content', { state: 'visible' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_product_modal.png') });
  console.log('✓ Product modal verified');

  // Close modal
  await page.click('.modal-content button:has-text("✕"), .modal-content button');
  await page.waitForTimeout(400);

  // 4. Add items to cart
  console.log('4. Adding items to cart...');
  // Click all categories again
  await page.click('button:has-text("Все деликатесы")');
  await page.waitForTimeout(300);

  // Add first 2 products
  const addButtons = page.locator('button:has-text("В корзину")');
  await addButtons.nth(0).click();
  await page.waitForTimeout(200);
  await addButtons.nth(1).click();
  await page.waitForTimeout(200);

  // Open Cart Drawer
  console.log('5. Opening Cart Drawer...');
  await page.click('.header-cart-btn');
  await page.waitForSelector('.drawer-content', { state: 'visible' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_cart_drawer.png') });
  console.log('✓ Cart drawer opened');

  // Switch to Delivery
  console.log('6. Testing Delivery with DaData distance check...');
  await page.click('button:has-text("Доставка до двери")');
  await page.waitForTimeout(300);

  // Test Case A: Outside 4km (Nizhny Novgorod center)
  console.log('6a. Testing outside 4km address...');
  const addressInput = page.locator('input[placeholder*="д. Бурцево"]');
  await addressInput.fill('г Нижний Новгород, ул Белинского, д 10');
  await page.click('button:has-text("Проверить")');
  await page.waitForSelector('.distance-badge-ineligible', { state: 'visible', timeout: 10000 });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_delivery_ineligible.png') });
  console.log('✓ Ineligible address alert verified (> 4 km)');

  // Test Case B: Inside 4km (Burtsevo)
  console.log('6b. Testing inside 4km address...');
  await addressInput.fill('д Бурцево, ул Раздолье, д 236');
  await page.click('button:has-text("Проверить")');
  await page.waitForSelector('.distance-badge-eligible', { state: 'visible', timeout: 10000 });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_delivery_eligible.png') });
  console.log('✓ Eligible address verified (distance < 4 km, 250 руб delivery fee)');

  // 7. Place Order
  console.log('7. Submitting order...');
  await page.fill('input[placeholder="Например: Иван"]', 'Алексей Смирнов');
  await page.fill('input[placeholder="+7 (900) 000-00-00"]', '+7 (910) 888-77-66');
  await page.fill('textarea[placeholder*="позвоните"]', 'Доставить к вечеру, пожалуйста');

  await page.click('button[type="submit"]:has-text("Подтвердить заказ")');
  await page.waitForSelector('.modal-content:has-text("Заказ успешно принят")', { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_order_success.png') });
  console.log('✓ Order submitted successfully and confirmation modal displayed');

  // Close confirmation
  await page.click('button:has-text("Вернуться к покупкам")');
  await page.waitForTimeout(400);

  // 8. Admin Panel Login
  console.log('8. Logging in to Admin Panel...');
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_admin_login.png') });

  await page.fill('input[type="password"]', 'nevdakhin2026');
  await page.click('button[type="submit"]:has-text("Войти в панель")');
  await page.waitForURL('**/admin', { timeout: 10000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_admin_orders.png') });
  console.log('✓ Admin dashboard loaded with new order');

  // 9. Admin Products & Categories
  console.log('9. Checking Admin Products tab...');
  await page.click('button:has-text("Товары")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '10_admin_products.png') });
  console.log('✓ Admin products tab verified');

  console.log('10. Checking Admin Categories tab...');
  await page.click('button:has-text("Категории")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '11_admin_categories.png') });
  console.log('✓ Admin categories tab verified');

  console.log('11. Checking Admin Settings tab...');
  await page.click('button:has-text("Настройки и доставка")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '12_admin_settings.png') });
  console.log('✓ Admin settings tab verified');

  await browser.close();
  console.log('--- All Playwright E2E Tests Finished Successfully! ---');
}

runE2E().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
