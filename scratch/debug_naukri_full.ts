import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  console.log("=== Debugging Naukri Page 1 ===");
  try {
    const response = await page.goto('https://www.naukri.com/jobs-in-india?k=VP+Marketing', { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(5000);

    const status = response ? response.status() : 'No response';
    const title = await page.title();
    console.log(`Status: ${status} | Title: "${title}"`);

    await page.screenshot({ path: 'naukri-sub-debug.png' });
    console.log("Screenshot saved to naukri-sub-debug.png");

    const html = await page.content();
    console.log(`HTML length: ${html.length}`);

    // Check selectors
    const cards = await page.locator('.srp-jobtuple-wrapper').all();
    console.log(`Found ${cards.length} Naukri cards.`);

    for (let i = 0; i < Math.min(cards.length, 5); i++) {
      const card = cards[i];
      console.log(`\nCard ${i + 1}:`);

      // 1. Title selector
      const titleEl = card.locator('a.title, .title, [class*="title"]');
      let title = '';
      if (await titleEl.count() > 0) {
        title = (await titleEl.first().textContent() || '').trim();
      }

      // 2. Company selector
      const companyEl = card.locator('a.comp-name, .comp-name, [class*="comp-name"], [class*="company"]');
      let company = '';
      if (await companyEl.count() > 0) {
        company = (await companyEl.first().textContent() || '').trim();
      }

      // 3. Location selector
      const locationEl = card.locator('.locWdth, span.loc, [class*="loc"]');
      let location = '';
      if (await locationEl.count() > 0) {
        location = (await locationEl.first().textContent() || '').trim();
      }

      // 4. URL selector
      let url = '';
      const urlEl = card.locator('a.title, .title, a[href*="/job-listings-"]').first();
      if (await urlEl.count() > 0) {
        url = await urlEl.getAttribute('href') || '';
      }

      // 5. Snippet selector
      const snippetEl = card.locator('.job-description, .job-desc, [class*="job-description"], [class*="job-desc"], [class*="description"]');
      let snippet = '';
      if (await snippetEl.count() > 0) {
        snippet = (await snippetEl.first().textContent() || '').trim();
      }

      console.log(`  Title: "${title}"`);
      console.log(`  Company: "${company}"`);
      console.log(`  Location: "${location}"`);
      console.log(`  URL: "${url}"`);
      console.log(`  Snippet: "${snippet}"`);
    }

    // Print all div class names on page
    const divClasses = await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      return Array.from(new Set(divs.map(d => d.className).filter(c => c.includes('tuple') || c.includes('wrapper') || c.includes('job')))).slice(0, 20);
    });
    console.log("Div classes sample:", divClasses);

  } catch (err: any) {
    console.error("Error:", err.message);
  }

  await browser.close();
}

main();
