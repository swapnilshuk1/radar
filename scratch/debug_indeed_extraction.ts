import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  console.log("=== Debugging Indeed Extraction ===");
  try {
    await page.goto('https://in.indeed.com/jobs?q=VP+Marketing', { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(5000);

    const cards = await page.locator('div.job_seen_beacon, td.resultContent').all();
    console.log(`Found ${cards.length} cards.`);

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      console.log(`\nCard ${i + 1}:`);
      
      try {
        const titleEl = card.locator('h2.jobTitle, .jobTitle');
        const titleCount = await titleEl.count();
        let title = '';
        if (titleCount > 0) {
          title = (await titleEl.first().textContent() || '').trim();
        }
        console.log(`  Title count: ${titleCount} | Title: "${title}"`);

        const companyEl = card.locator('[data-testid="company-name"], .companyName');
        const companyCount = await companyEl.count();
        let company = '';
        if (companyCount > 0) {
          company = (await companyEl.first().textContent() || '').trim();
        }
        console.log(`  Company count: ${companyCount} | Company: "${company}"`);

        const locationEl = card.locator('[data-testid="text-location"], .companyLocation');
        const locationCount = await locationEl.count();
        let location = '';
        if (locationCount > 0) {
          location = (await locationEl.first().textContent() || '').trim();
        }
        console.log(`  Location count: ${locationCount} | Location: "${location}"`);

        const urlEl = card.locator('a[href*="/rc/clk"], a[href*="/jobs/view"]').first();
        const urlCount = await urlEl.count();
        let href = '';
        if (urlCount > 0) {
          href = await urlEl.getAttribute('href') || '';
        }
        console.log(`  URL count: ${urlCount} | href: "${href}"`);

        const snippetEl = card.locator('.job-snippet, .underSection');
        const snippetCount = await snippetEl.count();
        let snippet = '';
        if (snippetCount > 0) {
          snippet = (await snippetEl.first().textContent() || '').trim();
        }
        console.log(`  Snippet count: ${snippetCount} | snippet: "${snippet}"`);

      } catch (err: any) {
        console.log(`  Error on card ${i + 1}: ${err.message}`);
      }
    }

  } catch (err: any) {
    console.error("Error:", err.message);
  }

  await browser.close();
}

main();
