import { chromium } from 'playwright';
import { prisma } from '../lib/db';
import { getConfig } from '../lib/ranking/config';

// Replicate sanitization helpers from scraper.ts
function isValidExtractedCompany(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  if (normalized.length < 2 || normalized.length > 50) return false;
  
  const invalidWords = [
    'linkedin', 'indeed', 'naukri', 'guest', 'area', 'jobs', 'hiring', 'seeking', 
    'recruiting', 'recruitment', 'careers', 'india', 'work', 'office', 'remote', 
    'apply', 'opportunity', 'position', 'role', 'team', 'company', 'employer',
    'view', 'job', 'view/job', 'the', 'an', 'a', 'search'
  ];
  
  if (invalidWords.includes(normalized)) return false;
  if (normalized.includes('/') || normalized.includes('\\') || normalized.includes('?')) return false;
  if (/^\d+$/.test(normalized)) return false;
  return true;
}

function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function sanitizeCompanyName(
  company: string | null | undefined,
  title: string,
  snippet: string,
  url: string
): string | null {
  let name = (company || '').trim();
  name = name.replace(/\s+/g, ' ');
  const lowerName = name.toLowerCase();
  
  const isInvalid = !name || 
                    lowerName === 'linkedin guest area' || 
                    lowerName === 'linkedin' || 
                    lowerName === 'linkedin guest';
                    
  if (!isInvalid) {
    return name;
  }

  console.log(`[Sanitization] Invalid company name "${name}" found for "${title}". Recovering...`);

  try {
    const decodedUrl = decodeURIComponent(url);
    const atMatch = decodedUrl.match(/-at-([a-zA-Z0-9-]+?)(?:-\d+|\?|$)/i);
    if (atMatch && atMatch[1]) {
      let parsed = atMatch[1].replace(/-/g, ' ').trim();
      if (isValidExtractedCompany(parsed)) {
        return capitalizeWords(parsed);
      }
    }
  } catch (e) {}

  try {
    const atMatch = snippet.match(/(?:at|for)\s+([A-Z][a-zA-Z0-9\s\.\,&]+?)(?:\s+is|\s+in|\s+under|\s+with|\s+to|\s+for|\.|\,|招聘|is hiring|$)/);
    if (atMatch && atMatch[1]) {
      let parsed = atMatch[1].trim();
      if (isValidExtractedCompany(parsed)) {
        return parsed;
      }
    }
    const simpleAtMatch = snippet.match(/\bat\s+([a-zA-Z0-9\s\.\,&]{3,30}?)(?:\s+is|\s+in|\s+under|\s+with|\.|\,|$)/i);
    if (simpleAtMatch && simpleAtMatch[1]) {
      let parsed = simpleAtMatch[1].trim();
      if (isValidExtractedCompany(parsed)) {
        return capitalizeWords(parsed);
      }
    }
  } catch (e) {}

  return null;
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  console.log("=== Debugging Indeed Scrape and Save ===");
  try {
    await page.goto('https://in.indeed.com/jobs?q=VP+Marketing', { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(5000);

    // ONLY select div.job_seen_beacon to avoid duplicates from td.resultContent
    const cards = await page.locator('div.job_seen_beacon').all();
    console.log(`Found ${cards.length} unique cards.`);

    const jobsFound: any[] = [];

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      try {
        let title = '';
        const titleEl = card.locator('h2.jobTitle, .jobTitle');
        if (await titleEl.count() > 0) {
          title = (await titleEl.first().textContent() || '').trim();
        }

        let company = '';
        const companyEl = card.locator('[data-testid="company-name"], .companyName');
        if (await companyEl.count() > 0) {
          company = (await companyEl.first().textContent() || '').trim();
        }

        let location = '';
        const locationEl = card.locator('[data-testid="text-location"], .companyLocation');
        if (await locationEl.count() > 0) {
          location = (await locationEl.first().textContent() || '').trim();
        }

        let url = '';
        const urlEl = card.locator('h2.jobTitle a, .jobTitle a, a[href*="/rc/clk"], a[href*="/pagead/clk"], a[href*="/jobs/view"]').first();
        if (await urlEl.count() > 0) {
          let href = await urlEl.getAttribute('href') || '';
          url = href;
          if (href && !href.startsWith('http')) {
            url = `https://in.indeed.com${href}`;
          }
          if (url) {
            url = url.split('&')[0];
          }
        }

        let snippet = '';
        const snippetEl = card.locator('.job-snippet, .underSection');
        if (await snippetEl.count() > 0) {
          snippet = (await snippetEl.first().textContent() || '').trim();
        } else {
          snippet = title;
        }

        if (title && url) {
          jobsFound.push({ title, company, location, url, snippet });
        }
      } catch (err: any) {
        console.error(`Error parsing card ${i}:`, err.message);
      }
    }

    console.log(`Successfully parsed ${jobsFound.length} raw jobs.`);

    for (const job of jobsFound) {
      const sanitizedCompany = sanitizeCompanyName(job.company, job.title, job.snippet, job.url);
      
      let shouldDiscard = false;
      if (!sanitizedCompany) {
        shouldDiscard = true;
      } else {
        const lowerSanitized = sanitizedCompany.toLowerCase();
        if (lowerSanitized.trim() === '' || lowerSanitized.includes('guest area')) {
          shouldDiscard = true;
        }
      }

      if (shouldDiscard) {
        console.log(`[Discarded] Title: "${job.title}" | Company: "${job.company}" | Reason: Sanitization failure`);
        continue;
      }

      const existingJob = await prisma.discoveredJob.findUnique({
        where: { url: job.url }
      });

      if (existingJob) {
        console.log(`[Skipped - Duplicate URL] Title: "${job.title}" | Company: "${sanitizedCompany}"`);
      } else {
        console.log(`[To Be Saved] Title: "${job.title}" | Company: "${sanitizedCompany}"`);
      }
    }

  } catch (err: any) {
    console.error("Main error:", err.message);
  }

  await browser.close();
}

main();
