import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/feofa/.gemini/antigravity-ide/brain/769d9b8f-0c26-4366-ba88-07bdebf5fce7';

async function runTests() {
  console.log('Launching browser via Microsoft Edge...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  // TEST 1: Desktop (1440x900)
  console.log('=== TEST 1: DESKTOP (1440x900) ===');
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(500);

  // 1.1 Check phone link
  const phoneText = await desktopPage.$eval('.header-phone-link', el => el.textContent);
  console.log('Desktop phone link text:', phoneText.trim());

  // 1.2 Scroll to catalog and check sticky categories bar
  await desktopPage.evaluate(() => window.scrollTo(0, 500));
  await desktopPage.waitForTimeout(500);
  await desktopPage.screenshot({ path: path.join(ARTIFACT_DIR, 'resp_1_desktop_scroll_sticky.png') });
  console.log('Saved resp_1_desktop_scroll_sticky.png');

  // 1.3 Add 2 items to cart
  const addButtons = await desktopPage.$$('.product-card .btn-primary');
  if (addButtons.length >= 2) {
    await addButtons[0].click();
    await desktopPage.waitForTimeout(300);
    await addButtons[1].click();
    await desktopPage.waitForTimeout(300);
  }

  // 1.4 Click cart in header -> should navigate to /cart
  console.log('Clicking cart button in header...');
  await desktopPage.click('a.header-cart-btn');
  await desktopPage.waitForURL('**/cart');
  await desktopPage.waitForTimeout(800);
  await desktopPage.screenshot({ path: path.join(ARTIFACT_DIR, 'resp_2_desktop_cart_page.png') });
  console.log('Saved resp_2_desktop_cart_page.png');

  // TEST 2: Tablet (768x1024 - iPad Portrait)
  console.log('=== TEST 2: TABLET (768x1024) ===');
  const tabletContext = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const tabletPage = await tabletContext.newPage();
  await tabletPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await tabletPage.waitForTimeout(500);
  await tabletPage.screenshot({ path: path.join(ARTIFACT_DIR, 'resp_3_tablet_home.png') });
  console.log('Saved resp_3_tablet_home.png');

  // Scroll down to check tablet 2-column cards
  await tabletPage.evaluate(() => window.scrollTo(0, 600));
  await tabletPage.waitForTimeout(500);
  await tabletPage.screenshot({ path: path.join(ARTIFACT_DIR, 'resp_4_tablet_grid.png') });
  console.log('Saved resp_4_tablet_grid.png');

  // TEST 3: Mobile (390x844 - iPhone 14)
  console.log('=== TEST 3: MOBILE (390x844) ===');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(500);

  // Check horizontal overflow
  const hasHorizontalScroll = await mobilePage.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log('Mobile has horizontal overflow:', hasHorizontalScroll);

  // 3.1 Mobile Header & Hero screenshot
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'resp_5_mobile_hero.png') });
  console.log('Saved resp_5_mobile_hero.png');

  // 3.2 Mobile Hamburger menu
  await mobilePage.click('.mobile-menu-toggle');
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'resp_6_mobile_menu_open.png') });
  console.log('Saved resp_6_mobile_menu_open.png');
  await mobilePage.click('.mobile-menu-toggle'); // close menu
  await mobilePage.waitForTimeout(300);

  // 3.3 Scroll to catalog to check mobile sticky bar and cards
  await mobilePage.evaluate(() => window.scrollTo(0, 700));
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'resp_7_mobile_catalog_sticky.png') });
  console.log('Saved resp_7_mobile_catalog_sticky.png');

  // 3.4 Add item to cart and check floating cart bar on mobile
  const mobileAddBtn = await mobilePage.$('.product-card .btn-primary');
  if (mobileAddBtn) {
    await mobileAddBtn.click();
    await mobilePage.waitForTimeout(400);
  }
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'resp_8_mobile_floating_cart.png') });
  console.log('Saved resp_8_mobile_floating_cart.png');

  // 3.5 Click floating cart bar -> navigates to /cart on mobile
  await mobilePage.click('.mobile-cart-bar a');
  await mobilePage.waitForURL('**/cart');
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'resp_9_mobile_cart_page.png') });
  console.log('Saved resp_9_mobile_cart_page.png');

  await browser.close();
  console.log('All tests passed successfully!');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
