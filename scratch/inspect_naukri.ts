import { chromium } from 'playwright';

async function main() {
  console.log("=== Launching Headful Chrome for Naukri & Indeed ===");
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  // Test Naukri pagination structures
  const testUrls = [
    'https://www.naukri.com/jobs-in-india?k=VP+Marketing',
    'https://www.naukri.com/jobs-in-india?k=VP+Marketing&pageNo=2',
    'https://www.naukri.com/vp-marketing-jobs-in-india-2'
  ];

  for (const url of testUrls) {
    try {
      console.log(`Navigating to: ${url}`);
      const response = await page.goto(url, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(5000);
      
      const status = response ? response.status() : 'No response';
      const title = await page.title();
      console.log(`Status: ${status} | Title: "${title}"`);

      // Let's take a screenshot
      const filename = url.includes('pageNo=2') ? 'naukri-pageno2.png' : url.includes('jobs-in-india-2') ? 'naukri-path2.png' : 'naukri-page1.png';
      await page.screenshot({ path: filename });
      console.log(`Saved screenshot: ${filename}`);

      // Inspect selectors if it is a search page
      if (status === 200 && !title.includes('Access Denied') && !title.includes('Page not found')) {
        const classes = await page.evaluate(() => {
          // Find potential card containers
          const els = Array.from(document.querySelectorAll('div, article, li'));
          const matches = els.filter(el => {
            const className = el.className || '';
            return className.includes('jobtuple') || className.includes('jobTuple') || className.includes('tuple') || className.includes('Tuple') || className.includes('srp-job');
          });
          return Array.from(new Set(matches.map(m => m.className)));
        });
        console.log("Found matching class names:", classes);
      }
      console.log("-----------------------------------");
    } catch (e: any) {
      console.error(`Error on URL ${url}: ${e.message}`);
    }
  }

  await browser.close();
}

main();
