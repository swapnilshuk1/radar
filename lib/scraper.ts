import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { prisma } from './db';
import { RankingEngine } from './ranking/RankingService';
import { Telemetry } from './ranking/Telemetry';
import { getConfig, getCandidateProfile } from './ranking/config';
import { OpportunityEnrichmentService } from './ranking/OpportunityEnrichmentService';
import path from 'path';
import fs from 'fs';

// Initialize stealth plugin
chromium.use(stealthPlugin());

const MAX_PAGES = 2;

// Check if the extracted string is a valid company name (not a common placeholder, generic word, or relative URL segment)
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
  
  // Make sure it doesn't contain generic instructions, paths, or numbers only
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
  url: string,
  logCallback: (msg: string) => void
): string | null {
  let name = (company || '').trim();
  
  // Replace multiple whitespaces/newlines with single space
  name = name.replace(/\s+/g, ' ');

  const lowerName = name.toLowerCase();
  
  // Check if invalid/placeholder
  const isInvalid = !name || 
                    lowerName === 'linkedin guest area' || 
                    lowerName === 'linkedin' || 
                    lowerName === 'linkedin guest';
                    
  if (!isInvalid) {
    return name;
  }

  logCallback(`[Sanitization] Invalid company name "${name || 'empty'}" found for "${title}". Attempting recovery...`);

  // 1. Try to extract from URL (e.g. /jobs/view/chief-marketing-officer-at-google-4427962589)
  try {
    const decodedUrl = decodeURIComponent(url);
    const atMatch = decodedUrl.match(/-at-([a-zA-Z0-9-]+?)(?:-\d+|\?|$)/i);
    if (atMatch && atMatch[1]) {
      let parsed = atMatch[1].replace(/-/g, ' ').trim();
      if (isValidExtractedCompany(parsed)) {
        const recovered = capitalizeWords(parsed);
        logCallback(`[Sanitization] Recovered company "${recovered}" from URL slug.`);
        return recovered;
      }
    }
  } catch (e) {}

  // 2. Try to extract from snippet (e.g. "Looking for CMO at Reliance Retail...")
  try {
    const atMatch = snippet.match(/(?:at|for)\s+([A-Z][a-zA-Z0-9\s\.\,&]+?)(?:\s+is|\s+in|\s+under|\s+with|\s+to|\s+for|\.|\,|招聘|is hiring|$)/);
    if (atMatch && atMatch[1]) {
      let parsed = atMatch[1].trim();
      if (isValidExtractedCompany(parsed)) {
        logCallback(`[Sanitization] Recovered company "${parsed}" from snippet pattern match.`);
        return parsed;
      }
    }

    // Try simple word "at [company]" match
    const simpleAtMatch = snippet.match(/\bat\s+([a-zA-Z0-9\s\.\,&]{3,30}?)(?:\s+is|\s+in|\s+under|\s+with|\.|\,|$)/i);
    if (simpleAtMatch && simpleAtMatch[1]) {
      let parsed = simpleAtMatch[1].trim();
      if (isValidExtractedCompany(parsed)) {
        const recovered = capitalizeWords(parsed);
        logCallback(`[Sanitization] Recovered company "${recovered}" from simple snippet match.`);
        return recovered;
      }
    }
  } catch (e) {}

  logCallback(`[Sanitization] Discarding job listing: Company name could not be resolved.`);
  return null;
}

// Captcha words or elements that suggest blocking in page title
const TITLE_CAPTCHA_INDICATORS = [
  'captcha',
  'cloudflare',
  'security verification',
  'verify you are human',
  'unusual traffic',
  'checking your browser',
  'hcaptcha',
  'recaptcha'
];

// Captcha words that suggest blocking in page body (excludes 'cloudflare' to prevent false positive matches on job listings from Cloudflare itself)
const BODY_CAPTCHA_INDICATORS = [
  'captcha',
  'security verification',
  'verify you are human',
  'unusual traffic',
  'checking your browser',
  'hcaptcha',
  'recaptcha'
];

const LOGIN_INDICATORS = [
  'linkedin.com/signup',
  'linkedin.com/login',
  'linkedin.com/checkpoint/lg',
  'indeed.com/signin',
  'naukri.com/nlogin',
  'naukri.com/login'
];

async function detectCaptchaOrLogin(page: any, logCallback: (msg: string) => void): Promise<{ blocked: boolean; isLogin: boolean }> {
  try {
    const url = page.url().toLowerCase();
    
    // Check URL first (doesn't throw navigation errors)
    if (url.includes('checkpoint/challenge') || url.includes('challenge-platform')) {
      return { blocked: true, isLogin: false };
    }

    for (const indicator of LOGIN_INDICATORS) {
      if (url.includes(indicator)) {
        return { blocked: true, isLogin: true };
      }
    }

    const title = (await page.title()).toLowerCase();
    const visibleText = (await page.locator('body').innerText()).toLowerCase();

    // Check Title
    for (const indicator of TITLE_CAPTCHA_INDICATORS) {
      if (title.includes(indicator)) {
        logCallback(`[DEBUG] detectCaptchaOrLogin: Matched captcha indicator "${indicator}" in page title`);
        return { blocked: true, isLogin: false };
      }
    }

    // Check DOM text content or Cloudflare element
    const hasCloudflare = await page.locator('#challenge-stage, iframe[src*="cloudflare"]').count() > 0;
    if (hasCloudflare) {
      logCallback(`[DEBUG] detectCaptchaOrLogin: Matched Cloudflare Challenge elements`);
      return { blocked: true, isLogin: false };
    }

    for (const indicator of BODY_CAPTCHA_INDICATORS) {
      if (visibleText.includes(indicator)) {
        logCallback(`[DEBUG] detectCaptchaOrLogin: Matched captcha indicator "${indicator}" in body text`);
        return { blocked: true, isLogin: false };
      }
    }

    // LinkedIn login input verification
    const hasLinkedInInputs = await page.locator('input#username, input#password, button[type="submit"]').count() >= 2;
    if (hasLinkedInInputs && url.includes('linkedin.com')) {
      return { blocked: true, isLogin: true };
    }
  } catch (e) {
    // Gracefully handle situations where page is mid-navigation
    return { blocked: false, isLogin: false };
  }

  return { blocked: false, isLogin: false };
}

async function handleCaptchaOrLoginGate(page: any, portal: string, searchUrl: string, logCallback: (msg: string) => void) {
  let status = await detectCaptchaOrLogin(page, logCallback);
  if (!status.blocked) return;

  if (status.isLogin) {
    logCallback(`[${portal}] WARNING: Login wall detected!`);
    logCallback(`[${portal}] Bringing browser window to FRONT-FOCUS. Please sign in manually.`);
  } else {
    logCallback(`[${portal}] WARNING: Security verification/CAPTCHA gate detected!`);
    logCallback(`[${portal}] Bringing browser window to FRONT-FOCUS. Please solve it manually.`);
  }

  // Bring to front
  try {
    await page.bringToFront();
  } catch (e) {}

  // Polling loop waiting for manual resolution
  let attempts = 0;
  while (status.blocked) {
    attempts++;
    await page.waitForTimeout(3000);
    
    // Re-check block status
    status = await detectCaptchaOrLogin(page, logCallback);
    
    if (attempts % 10 === 0) {
      logCallback(`[${portal}] Still waiting for user action (solve CAPTCHA or Login)... (Attempt ${attempts})`);
    }

    if (!status.blocked) {
      logCallback(`[${portal}] Gate cleared successfully!`);
      const currentUrl = page.url().toLowerCase();
      // If we are not on the search page, navigate back to searchUrl
      if (!currentUrl.includes('search') && (portal === 'LinkedIn' || currentUrl.includes('/feed/'))) {
        logCallback(`[${portal}] Redirecting back to search URL: ${searchUrl}`);
        try {
          await page.goto(searchUrl, { waitUntil: 'load', timeout: 45000 });
        } catch (e: any) {
          logCallback(`Failed to navigate back to search page: ${e.message}`);
        }
      }
      break;
    }
  }
}

export async function runScraper(logCallback: (msg: string) => void) {
  (global as any).shouldStopScraper = false;
  const config = getConfig();

  // Generate a unique Trace ID for the full pipeline run
  const traceId = Telemetry.generateTraceId();
  Telemetry.log(traceId, "scraper", "INFO", "Scraper session started");
  logCallback(`[Trace ID: ${traceId}] Scraper session started.`);
  
  // Set up user data directory outside of the Next.js project directory
  // to prevent Turbopack's file watcher from trying to read locked files.
  const userDataDir = path.join(process.cwd(), '..', 'scraper-profile');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  let context: any;
  let browser: any;
  let usingCDP = false;

  try {
    logCallback('Initializing new persistent browser context (guaranteed visible)...');
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false, // Must be false for captcha/interaction
      viewport: { width: 1280, height: 800 },
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox'
      ],
      ignoreDefaultArgs: ['--enable-automation']
    });
  } catch (error: any) {
    logCallback(`Failed to launch browser: ${error.message}`);
    throw error;
  }

  logCallback('Opening a new browser tab for scraping...');
  const page = await context.newPage();

  // Auto-dismiss dialogs to prevent scraper hangs
  page.on('dialog', async (dialog: any) => {
    logCallback(`[SYSTEM] Auto-dismissing browser dialog: "${dialog.message()}"`);
    try {
      await dialog.dismiss();
    } catch (e) {}
  });

  // Set standard headers and user agent (only if running context we control)
  if (!usingCDP) {
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9'
    });
  }

  try {
    for (const [portalName, portalInfo] of Object.entries(config.portals)) {
      if (!portalInfo.active) {
        logCallback(`Portal ${portalName} is inactive. Skipping.`);
        continue;
      }

      logCallback(`\n--- Starting scraping for portal: ${portalName} ---`);

      // Referrer flow initialization: Go to the homepage first once per portal to establish correct session cookies/CF state.
      try {
        let homeUrl = 'https://www.linkedin.com/';
        if (portalName === 'Indeed') homeUrl = 'https://in.indeed.com/';
        else if (portalName === 'Naukri') homeUrl = 'https://www.naukri.com/';
        
        logCallback(`[${portalName}] Establishing initial session via homepage: ${homeUrl}`);
        await page.goto(homeUrl, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(3000);
      } catch (homeErr: any) {
        logCallback(`[${portalName}] Warning establishing session on ${portalName} homepage: ${homeErr.message}`);
      }

      for (const mandate of config.search_parameters.target_mandates) {
        if ((global as any).shouldStopScraper) {
          logCallback('SYSTEM: Scraping terminated by user request.');
          return;
        }

        logCallback(`Searching for mandate: "${mandate}"`);

        for (let pageNum = 0; pageNum < MAX_PAGES; pageNum++) {
          if ((global as any).shouldStopScraper) {
            logCallback('SYSTEM: Scraping terminated by user request.');
            return;
          }

          logCallback(`Scraping Page ${pageNum + 1} of ${MAX_PAGES}...`);
          
          let searchUrl = '';
          if (portalName === 'LinkedIn') {
            const startVal = pageNum * 25;
            searchUrl = `${portalInfo.base_url}${encodeURIComponent(mandate)}&start=${startVal}`;
          } else if (portalName === 'Indeed') {
            const startVal = pageNum * 10;
            searchUrl = `${portalInfo.base_url}${encodeURIComponent(mandate)}&start=${startVal}`;
          } else if (portalName === 'Naukri') {
            if (pageNum === 0) {
              searchUrl = `https://www.naukri.com/jobs-in-india?k=${encodeURIComponent(mandate)}`;
            } else {
              searchUrl = `https://www.naukri.com/jobs-in-india-${pageNum + 1}?k=${encodeURIComponent(mandate)}`;
            }
          }

          logCallback(`Navigating to: ${searchUrl}`);
          
          try {
            // Wait for commit (headers received) to prevent ERR_ABORTED exceptions during redirects
            await page.goto(searchUrl, { waitUntil: 'commit', timeout: 30000 });
          } catch (e: any) {
            logCallback(`Navigation commit status: ${e.message}`);
          }

          // Settle delay to let any redirects resolve
          await page.waitForTimeout(3000);

          // Check if we hit a CAPTCHA gate or Login wall
          await handleCaptchaOrLoginGate(page, portalName, searchUrl, logCallback);

          // Add a human-like delay
          await page.waitForTimeout(2000 + Math.random() * 2000);

          let jobsFound: any[] = [];

          if (portalName === 'LinkedIn') {
            // Wait for cards or results lists to render instead of static timeout
            logCallback('[LinkedIn] Waiting up to 15s for job cards to render...');
            try {
              await page.waitForSelector('.base-card, .jobs-search__results-list li, [data-entity-hovercard-id], .job-card-container, .job-card-list__container, [data-occludable-job-id]', { timeout: 15000 });
            } catch (e) {
              logCallback('[LinkedIn] Timeout waiting for job cards, checking fallbacks...');
            }
            
            // Collect job cards
            let cards = await page.locator('.base-card, .jobs-search__results-list li, [data-entity-hovercard-id], .job-card-container, .job-card-list__container, [data-occludable-job-id]').all();
            logCallback(`Found ${cards.length} potential LinkedIn listings on page.`);

            if (cards.length > 0) {
              logCallback('[LinkedIn] Scrolling cards to trigger dynamic lazy loading of metadata...');
              // Scroll cards step-by-step to load list elements
              for (let i = 0; i < Math.min(cards.length, 25); i++) {
                try {
                  await cards[i].scrollIntoViewIfNeeded({ timeout: 1000 });
                  await page.waitForTimeout(100);
                } catch (e) {}
              }
              await page.waitForTimeout(500);
              // Refetch cards to capture newly loaded DOM elements
              cards = await page.locator('.base-card, .jobs-search__results-list li, [data-entity-hovercard-id], .job-card-container, .job-card-list__container, [data-occludable-job-id]').all();
            }

            if (cards.length === 0) {
              const anchors = await page.locator('a[href*="/jobs/view/"]').all();
              logCallback(`Found ${anchors.length} fallback LinkedIn job links on page.`);
              for (const anchor of anchors) {
                try {
                  let url = await anchor.getAttribute('href') || '';
                  if (url) {
                    url = url.split('?')[0];
                  }
                  if (url && !url.startsWith('http')) {
                    url = `https://www.linkedin.com${url}`;
                  }
                  const title = (await anchor.textContent() || '').trim();
                  if (title && url && !jobsFound.some(j => j.url === url)) {
                    jobsFound.push({
                      title,
                      company: 'LinkedIn Guest Area',
                      location: 'India',
                      url,
                      snippet: 'Direct listing link',
                      sourcePortal: 'LinkedIn'
                    });
                  }
                } catch (e) {}
              }
            } else {
              let cardIndex = 0;
              for (const card of cards) {
                cardIndex++;
                try {
                  const titleEl = card.locator('.base-search-card__title, .job-search-card__title, .job-card-list__title, h3, a');
                  let title = '';
                  if (await titleEl.count() > 0) {
                    title = (await titleEl.first().textContent() || '').trim();
                  }
                  
                  const companyEl = card.locator('.base-search-card__subtitle, .job-search-card__subtitle, .company-name, .artdeco-entity-lockup__subtitle');
                  let company = '';
                  if (await companyEl.count() > 0) {
                    company = (await companyEl.first().textContent() || '').trim();
                  }
                  
                  // Refined location selector: check specific location classes first to avoid matching empty container metadata tags
                  const locationEl = card.locator('span.job-search-card__location, .job-search-card__location, .job-card-container__location, .job-card-list__metadata-item').first();
                  let location = '';
                  if (await locationEl.count() > 0) {
                    location = (await locationEl.textContent() || '').trim();
                  }

                  const urlEl = card.locator('a[href*="/jobs/view/"]').first();
                  let url = '';
                  if (await urlEl.count() > 0) {
                    url = await urlEl.getAttribute('href') || '';
                    if (url) {
                      url = url.split('?')[0];
                    }
                    if (url && !url.startsWith('http')) {
                      url = `https://www.linkedin.com${url}`;
                    }
                  }

                  // Click the card to load the job description details panel on the right
                  let snippet = '';
                  try {
                    logCallback(`[LinkedIn] Clicking card ${cardIndex}/${cards.length} ("${title}") to load description details...`);
                    await card.click({ timeout: 1500 });
                    await page.waitForTimeout(800); // Short wait for detail panel to render

                    const descEl = page.locator('.show-more-less-html__markup, .description__text, .jobs-description-content__text, .jobs-box__html-content').first();
                    if (await descEl.count() > 0) {
                      snippet = (await descEl.textContent() || '').trim();
                    }
                  } catch (e: any) {
                    logCallback(`[LinkedIn] Detail pane click failed: ${e.message}. Using fallback.`);
                  }

                  // Fallback if detail pane load failed or description text was empty
                  if (!snippet) {
                    const fallbackSnippetEl = card.locator('.job-search-card__snippet, .job-card-list__description-snippet').first();
                    if (await fallbackSnippetEl.count() > 0) {
                      snippet = (await fallbackSnippetEl.textContent() || '').trim();
                    } else {
                      snippet = title; // Absolute fallback
                    }
                  }

                  if (title && url) {
                    jobsFound.push({ title, company, location, url, snippet, sourcePortal: 'LinkedIn' });
                  }
                } catch (cardError) {}
              }
            }
          } 
          else if (portalName === 'Indeed') {
            logCallback('[Indeed] Waiting up to 10s for job cards to render...');
            try {
              await page.waitForSelector('div.job_seen_beacon, td.resultContent', { timeout: 10000 });
            } catch (e) {
              logCallback('[Indeed] Timeout waiting for job cards, checking fallbacks...');
            }
            let cards = await page.locator('div.job_seen_beacon, td.resultContent').all();
            logCallback(`Found ${cards.length} potential Indeed listings on page.`);

            if (cards.length === 0) {
              const anchors = await page.locator('a[href*="/rc/clk"], a[href*="/jobs/view"]').all();
              logCallback(`Found ${anchors.length} fallback Indeed job links on page.`);
              for (const anchor of anchors) {
                try {
                  let href = await anchor.getAttribute('href') || '';
                  let url = href;
                  if (href && !href.startsWith('http')) {
                    url = `https://in.indeed.com${href}`;
                  }
                  if (url) {
                    url = url.split('&')[0];
                  }
                  const title = (await anchor.textContent() || '').trim();
                  if (title && url && !jobsFound.some(j => j.url === url)) {
                    jobsFound.push({
                      title,
                      company: 'Indeed Guest Area',
                      location: 'India',
                      url,
                      snippet: 'Direct listing link',
                      sourcePortal: 'Indeed'
                    });
                  }
                } catch (e) {}
              }
            } else {
              for (const card of cards) {
                try {
                  const titleEl = card.locator('h2.jobTitle, .jobTitle');
                  const title = (await titleEl.textContent() || '').trim();

                  const companyEl = card.locator('[data-testid="company-name"], .companyName');
                  const company = (await companyEl.textContent() || '').trim();

                  const locationEl = card.locator('[data-testid="text-location"], .companyLocation');
                  const location = (await locationEl.textContent() || '').trim();

                  const urlEl = card.locator('a[href*="/rc/clk"], a[href*="/jobs/view"]').first();
                  let href = await urlEl.getAttribute('href') || '';
                  let url = href;
                  if (href && !href.startsWith('http')) {
                    url = `https://in.indeed.com${href}`;
                  }
                  if (url) {
                    url = url.split('&')[0]; // simple cleaning
                  }

                  const snippetEl = card.locator('.job-snippet, .underSection');
                  const snippet = (await snippetEl.textContent() || '').trim();

                  if (title && url) {
                    jobsFound.push({ title, company, location, url, snippet, sourcePortal: 'Indeed' });
                  }
                } catch (cardError) {}
              }
            }
          } 
          else if (portalName === 'Naukri') {
            logCallback('[Naukri] Waiting up to 10s for job cards to render...');
            try {
              await page.waitForSelector('.srp-jobtuple, .jobTuple', { timeout: 10000 });
            } catch (e) {
              logCallback('[Naukri] Timeout waiting for job cards, checking fallbacks...');
            }
            let cards = await page.locator('.srp-jobtuple, .jobTuple').all();
            logCallback(`Found ${cards.length} potential Naukri listings on page.`);

            if (cards.length === 0) {
              const anchors = await page.locator('a[href*="/job-listings-"]').all();
              logCallback(`Found ${anchors.length} fallback Naukri job links on page.`);
              for (const anchor of anchors) {
                try {
                  const url = await anchor.getAttribute('href') || '';
                  const title = (await anchor.textContent() || '').trim();
                  if (title && url && !jobsFound.some(j => j.url === url)) {
                    jobsFound.push({
                      title,
                      company: 'Naukri Guest Area',
                      location: 'India',
                      url,
                      snippet: 'Direct listing link',
                      sourcePortal: 'Naukri'
                    });
                  }
                } catch (e) {}
              }
            } else {
              for (const card of cards) {
                try {
                  const titleEl = card.locator('a.title, .title');
                  const title = (await titleEl.first().textContent() || '').trim();

                  const companyEl = card.locator('a.comp-name, .comp-name');
                  const company = (await companyEl.first().textContent() || '').trim();

                  const locationEl = card.locator('.locWdth, span.loc');
                  const location = (await locationEl.first().textContent() || '').trim();

                  let url = await titleEl.first().getAttribute('href') || '';
                  if (url && !url.startsWith('http')) {
                    url = `https://www.naukri.com${url}`;
                  }

                  const snippetEl = card.locator('.job-description, .job-desc, .job-description-details');
                  const snippet = (await snippetEl.first().textContent() || '').trim();

                  if (title && url) {
                    jobsFound.push({ title, company, location, url, snippet, sourcePortal: 'Naukri' });
                  }
                } catch (cardError) {}
              }
            }
          }

          // If 0 raw jobs found, capture a screenshot for debugging (5s limit)
          if (jobsFound.length === 0) {
            const screenshotPath = path.join(process.cwd(), '..', `screenshot-${portalName.toLowerCase()}-debug.png`);
            logCallback(`[${portalName}] WARNING: 0 jobs extracted. Saving page screenshot for verification to: ${screenshotPath}`);
            try {
              await page.screenshot({ path: screenshotPath, timeout: 5000 });
              
              // Log warning if user has elements indicating sign-in requirement
              const hasSignInForm = await page.locator('input#username, input#password, form[action*="login"]').count() > 0;
              if (hasSignInForm) {
                logCallback(`[${portalName}] ALERT: Form inputs detected. The browser might require you to sign in to search.`);
              }
            } catch (scrErr: any) {
              logCallback(`[${portalName}] Failed to take screenshot: ${scrErr.message}`);
            }
          }

          logCallback(`Scraped ${jobsFound.length} raw jobs from current page.`);

          // Process & Save jobs
          let savedCount = 0;
          let rejectedCount = 0;
          
          for (const job of jobsFound) {
            // Apply sanitization middleware
            const sanitizedCompany = sanitizeCompanyName(job.company, job.title, job.snippet, job.url, logCallback);
            
            let shouldDiscard = false;
            if (!sanitizedCompany) {
              shouldDiscard = true;
            } else {
              const lowerSanitized = sanitizedCompany.toLowerCase();
              
              if (lowerSanitized.trim() === '') {
                shouldDiscard = true;
              }
              
              if (lowerSanitized.includes('guest area')) {
                shouldDiscard = true;
              }
              
              if (lowerSanitized.includes('linkedin')) {
                if (job.sourcePortal === 'LinkedIn') {
                  shouldDiscard = true;
                } else if (lowerSanitized === 'linkedin') {
                  shouldDiscard = true;
                }
              }
            }

            if (shouldDiscard) {
              logCallback(`[Sanitization] Discarded listing: "${job.title}" because company name "${sanitizedCompany || 'empty'}" was unresolvable or invalid for ${job.sourcePortal}.`);
              rejectedCount++;
              continue; // Skip saving/upserting this job!
            }
            
            // Set the sanitized company name
            job.company = sanitizedCompany;

            // Check if job already exists by URL to avoid redundant ranking and LLM API costs
            const existingJob = await prisma.discoveredJob.findUnique({
              where: { url: job.url }
            });

            if (existingJob) {
              logCallback(`[Database] Job "${job.title}" already exists. Preserving record, updating scrapedAt timestamp.`);
              try {
                await prisma.discoveredJob.update({
                  where: { url: job.url },
                  data: { scrapedAt: new Date() }
                });
                savedCount++;
              } catch (dbError: any) {
                logCallback(`Failed to update timestamp for existing job: ${dbError.message}`);
              }
              continue; // Skip ranking and LLM enrichment entirely
            }

            Telemetry.startTimer(traceId, "normalizer");
            const ruleScore = RankingEngine.evaluateRulesOnly({
              title: job.title,
              snippet: job.snippet || '',
              location: job.location,
              company: job.company
            }, undefined, traceId);
            Telemetry.stopTimer(traceId, "normalizer", ruleScore === 0 ? "FAILED" : "SUCCESS",
              `Rule pre-filter: ${job.title}`, { ruleScore });

            if (ruleScore === 0) {
              logCallback(`[Filters] Rejected (filtered out by title/content exclusions): "${job.title}"`);
              rejectedCount++;
              continue;
            }

            // Run initial rules-only evaluation to get base score and base explanation
            const initResult = RankingEngine.evaluate({
              title: job.title,
              snippet: job.snippet || '',
              location: job.location,
              company: job.company,
              semanticData: null
            }, undefined, traceId);

            if (initResult.rejected) {
              logCallback(`[Filters] Rejected (rules evaluation failed): "${job.title}" — ${initResult.rejectReason}`);
              rejectedCount++;
              continue;
            }

            const initExplanation = initResult.explanation!;
            let finalExplanation = initExplanation;
            let finalScore = initExplanation.matchScore;
            let semanticDataJson: string | null = null;

            // Check if job qualifies for semantic enrichment based on threshold in config
            const config = getConfig();
            const seConfig = config.ranking_engine.semantic_enrichment;
            const profile = getCandidateProfile();

            if (seConfig && seConfig.enabled && ruleScore >= seConfig.minimum_rule_score) {
              logCallback(`[Semantic] Job "${job.title}" base score ${ruleScore} >= ${seConfig.minimum_rule_score}. Calling OpportunityEnrichmentService...`);
              try {
                const semData = await OpportunityEnrichmentService.enrich({
                  title: job.title,
                  snippet: job.snippet || '',
                  location: job.location,
                  company: job.company
                }, profile);

                semanticDataJson = JSON.stringify(semData);

                // Re-evaluate with semantic match included
                const finalResult = RankingEngine.evaluate({
                  title: job.title,
                  snippet: job.snippet || '',
                  location: job.location,
                  company: job.company,
                  semanticData: semData
                }, profile, traceId);

                if (finalResult.explanation) {
                  finalExplanation = finalResult.explanation;
                  finalScore = finalExplanation.matchScore;
                  logCallback(`[Semantic] Enrichment complete for "${job.title}". Final Score: ${finalScore} (Verdict: ${semData.executiveVerdict})`);
                }
              } catch (semErr: any) {
                logCallback(`[Semantic Error] Enrichment failed: ${semErr.message}`);
              }
            }

            try {
              // DATABASE UPSERT (Only update scrapedAt on duplicate to preserve status and rating)
              Telemetry.startTimer(traceId, "database");
              const normalizedUrl = job.url.split('?')[0].toLowerCase().trim();
              await prisma.discoveredJob.upsert({
                where: { url: job.url },
                update: { scrapedAt: new Date() },
                create: {
                  title: job.title,
                  company: job.company,
                  location: job.location,
                  sourcePortal: job.sourcePortal,
                  url: job.url,
                  normalizedUrl,
                  snippet: job.snippet || '',
                  matchScore: finalScore,
                  rankingData: JSON.stringify(finalExplanation),
                  rankingVersion: finalExplanation.version,
                  rankingConfigVersion: finalExplanation.configVersion,
                  semanticData: semanticDataJson,
                  jobHash: finalExplanation.jobHash ?? null,
                  rejected: false,
                  status: 'New',
                  scrapedAt: new Date()
                }
              });
              Telemetry.stopTimer(traceId, "database", "SUCCESS",
                `Saved: ${job.title}`, { url: job.url, score: finalScore });
              savedCount++;
            } catch (dbError: any) {
              Telemetry.log(traceId, "database", "FAILED", `DB save failed: ${job.title}`, { error: dbError.message });
              logCallback(`Database saving error for ${job.title}: ${dbError.message}`);
            }
          }

          logCallback(`Saved/Upserted ${savedCount} jobs. Rejected ${rejectedCount} jobs via filters.`);
        }
      }
    }
  } catch (err: any) {
    logCallback(`CRITICAL ERROR during scraping execution: ${err.message}`);
    throw err;
  } finally {
    logCallback('Cleaning up browser connection...');
    if (page) {
      try {
        await page.close();
        logCallback('Closed scraping page/tab.');
      } catch (closePageErr: any) {
        logCallback(`Error closing page: ${closePageErr.message}`);
      }
    }
    if (usingCDP) {
      if (browser) {
        try {
          await browser.disconnect();
          logCallback('Disconnected from remote Chrome session.');
        } catch (discErr: any) {
          logCallback(`Error disconnecting: ${discErr.message}`);
        }
      }
    } else {
      if (context) {
        try {
          await context.close();
          logCallback('Closed persistent browser context.');
        } catch (closeError: any) {
          logCallback(`Error closing context: ${closeError.message}`);
        }
      }
    }
  }

  logCallback('\nScraping workflow completed successfully!');
}
