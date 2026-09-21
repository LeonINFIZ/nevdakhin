import { chromium } from 'playwright';

async function run() {
  console.log('Testing Edge / Chrome channel launch...');
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    console.log('Successfully launched Edge!');
  } catch (err) {
    console.log('Edge failed, trying default chromium or chrome:', err.message);
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
      console.log('Successfully launched Chrome!');
    } catch (err2) {
      console.log('Chrome failed, attempting playwright install chromium...');
      process.exit(1);
    }
  }

  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  console.log('Page title:', await page.title());
  await browser.close();
  console.log('Success!');
}

run().catch(console.error);
