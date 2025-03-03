import puppeteer from 'puppeteer-core';

(async () => {
  // Connect to the existing Chrome instance via WebSocket
  const browser = await puppeteer.connect({
    browserWSEndpoint: `ws://localhost:3000?token=${process.env.API_KEY}`,
  })

  // Create a new page
  const page = await browser.newPage();

  // Navigate to chrome://gpu
  await page.goto('chrome://gpu');

  // Wait for the content to load
  await page.waitForSelector('body');

  // Take a screenshot
  await page.screenshot({ path: 'screenshot.png' });

  // Close the browser connection
  await browser.close();
})();
