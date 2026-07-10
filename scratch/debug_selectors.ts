import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  console.log("=== Testing Indeed ===");
  try {
    await page.goto('https://in.indeed.com/jobs?q=VP+Marketing', { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(5000);

    // Take screenshot of indeed
    await page.screenshot({ path: 'indeed-test-run.png' });
    console.log("Indeed screenshot saved.");

    // Evaluate selectors on Indeed page
    const selectors = [
      'div.job_seen_beacon',
      'td.resultContent',
      '.jobCard_mainContent',
      '.result',
      'a[href*="/rc/clk"]',
      'a[href*="/jobs/view"]',
      '[data-testid="jobCard"]',
      'li.css-5lfssm',
      'ul.css-ky12od > li'
    ];

    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      console.log(`Indeed selector "${selector}": ${count} matches`);
    }

    // Print first job card inner HTML structure if found
    const firstCard = page.locator('div.job_seen_beacon, td.resultContent, [data-testid="jobCard"]').first();
    if (await firstCard.count() > 0) {
      console.log("First card element name:", await firstCard.evaluate(el => el.tagName));
      console.log("First card class list:", await firstCard.evaluate(el => el.className));
      console.log("First card child links count:", await firstCard.locator('a').count());
    }

  } catch (err: any) {
    console.error("Indeed error:", err.message);
  }

  console.log("\n=== Testing Naukri Pagination ===");
  const naukriUrls = [
    'https://www.naukri.com/jobs-in-india?k=VP+Marketing',
    'https://www.naukri.com/jobs-in-india?k=VP+Marketing&pageNo=2',
    'https://www.naukri.com/jobs-in-india-2?k=VP+Marketing',
    'https://www.naukri.com/vp-marketing-jobs-in-india-2'
  ];

  for (const url of naukriUrls) {
    try {
      const response = await page.goto(url, { waitUntil: 'load', timeout: 20000 });
      const status = response ? response.status() : 'No response';
      const pageTitle = await page.title();
      console.log(`URL: ${url}`);
      console.log(`Status: ${status} | Title: "${pageTitle}"`);
      
      const cardCount = await page.locator('.srp-jobtuple, .jobTuple, [class*="jobTuple"], [class*="JobTuple"]').count();
      console.log(`Job tuples count: ${cardCount}`);
      console.log("-----------------------------------");
    } catch (err: any) {
      console.error(`Error on URL ${url}: ${err.message}`);
    }
  }

  await browser.close();
}

main();
