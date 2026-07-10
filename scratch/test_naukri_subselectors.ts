import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  console.log("=== Debugging Naukri Subselectors ===");
  try {
    await page.goto('https://www.naukri.com/jobs-in-india?k=VP+Marketing', { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(5000);

    const cards = await page.locator('.srp-jobtuple-wrapper, .cust-job-tuple').all();
    console.log(`Found ${cards.length} Naukri cards.`);

    for (let i = 0; i < Math.min(cards.length, 3); i++) {
      const card = cards[i];
      console.log(`\nCard ${i + 1}:`);

      // 1. Title
      const titleEl = card.locator('a.title, .title, [class*="title"]');
      let title = '';
      if (await titleEl.count() > 0) {
        title = (await titleEl.first().textContent() || '').trim();
      }
      
      // 2. Company
      const companyEl = card.locator('a.comp-name, .comp-name, [class*="comp-name"], [class*="company"]');
      let company = '';
      if (await companyEl.count() > 0) {
        company = (await companyEl.first().textContent() || '').trim();
      }

      // 3. Location
      const locationEl = card.locator('.locWdth, span.loc, [class*="loc"]');
      let location = '';
      if (await locationEl.count() > 0) {
        location = (await locationEl.first().textContent() || '').trim();
      }

      // 4. URL
      let url = '';
      const urlEl = card.locator('a.title, .title, a[href*="/job-listings-"]').first();
      if (await urlEl.count() > 0) {
        url = await urlEl.getAttribute('href') || '';
      }

      // 5. Snippet
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

  } catch (err: any) {
    console.error("Naukri error:", err.message);
  }

  await browser.close();
}

main();
