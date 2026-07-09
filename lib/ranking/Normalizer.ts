// lib/ranking/Normalizer.ts
// Preprocessing and Entity Extraction stage: normalizes raw job input.
// Extracts and builds the strongly-typed NormalizedJob entity structure.

import { JobInput, NormalizedJob } from './types';

const ABBREVIATIONS: Record<string, string> = {
  'vp': 'vice president',
  'svp': 'senior vice president',
  'evp': 'executive vice president',
  'avp': 'assistant vice president',
  'cmo': 'chief marketing officer',
  'coo': 'chief operating officer',
  'ceo': 'chief executive officer',
  'cdo': 'chief digital officer',
  'cro': 'chief revenue officer',
  'cgo': 'chief growth officer',
  'p&l': 'profit and loss',
  'gtm': 'go to market',
  'gcc': 'global capability center',
  'b2b': 'business to business',
  'b2c': 'business to consumer',
  'd2c': 'direct to consumer',
  'crm': 'customer relationship management',
  'martech': 'marketing technology',
  'wfh': 'work from home',
  'apac': 'asia pacific',
};

const LOCATION_ALIASES: Record<string, string> = {
  'gurgaon': 'gurugram',
  'ncr': 'delhi ncr',
  'new delhi': 'delhi ncr',
  'delhi': 'delhi ncr',
  'bangalore': 'bengaluru',
  'blr': 'bengaluru',
  'bombay': 'mumbai',
  'hyd': 'hyderabad',
  'chennai': 'chennai',
  'kolkata': 'kolkata',
};

const COMPANY_ALIASES: Record<string, string> = {
  'p&g': 'procter and gamble',
  'procter & gamble': 'procter and gamble',
  'hul': 'hindustan unilever',
  'hindustan unilever limited': 'hindustan unilever',
  'hcl': 'hcl technologies',
  'tcs': 'tata consultancy services',
  'infosys bpo': 'infosys',
  'google india': 'google',
  'microsoft india': 'microsoft',
  'amazon india': 'amazon',
};

function stripPunctuation(text: string): string {
  return text.replace(/['"`,;:!?()[\]{}<>]/g, ' ').replace(/\s+/g, ' ').trim();
}

function expandAbbreviations(text: string): string {
  let result = text;
  for (const [abbr, expansion] of Object.entries(ABBREVIATIONS)) {
    const regex = new RegExp(`\\b${abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    result = result.replace(regex, expansion);
  }
  return result;
}

function normalizeLocation(location: string): string {
  const lower = location.toLowerCase().trim();
  for (const [alias, canonical] of Object.entries(LOCATION_ALIASES)) {
    if (lower.includes(alias)) {
      return lower.replace(alias, canonical);
    }
  }
  return lower;
}

function normalizeCompany(company: string): string {
  const lower = company.toLowerCase().trim();
  for (const [alias, canonical] of Object.entries(COMPANY_ALIASES)) {
    if (lower === alias || lower.includes(alias)) {
      return lower.replace(alias, canonical);
    }
  }
  return lower;
}

function tokenize(text: string): string[] {
  return stripPunctuation(text)
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 1);
}

/** Check if a search term appears in a list of tokens using substring matching */
export function termMatchesTokens(term: string, tokens: string[]): boolean {
  const termNorm = term.toLowerCase().trim();
  const fullText = tokens.join(' ');
  return fullText.includes(termNorm);
}

/**
 * Normalize raw job input and execute deterministic Entity Extraction.
 */
export function normalize(raw: JobInput): NormalizedJob {
  const titleNorm = expandAbbreviations(stripPunctuation(raw.title));
  const snippetNorm = expandAbbreviations(stripPunctuation(raw.snippet || ''));

  const titleTokens = tokenize(titleNorm);
  const snippetTokens = tokenize(snippetNorm);
  const allTokens = [...titleTokens, ...snippetTokens];
  const allText = allTokens.join(' ');

  // 1. Seniority Inference
  let seniority = 'mid';
  if (termMatchesTokens('senior vice president', titleTokens) || termMatchesTokens('svp', titleTokens)) {
    seniority = 'svp';
  } else if (termMatchesTokens('vice president', titleTokens) || termMatchesTokens('vp', titleTokens)) {
    seniority = 'vp';
  } else if (termMatchesTokens('director', titleTokens) || termMatchesTokens('chief', titleTokens)) {
    seniority = 'director';
  }

  // 2. Functional Extraction
  const functionsList = ['marketing', 'sales', 'growth', 'operations', 'crm', 'martech', 'digital', 'transformation', 'gcc'];
  const functions = functionsList.filter(f => allText.includes(f));

  // 3. Skills Extraction
  const skillsList = ['salesforce cdp', 'crm migration', 'conversion strategy', 'a/b testing', 'roas optimization', 'customer lifecycle', 'retention'];
  const skills = skillsList.filter(s => allText.includes(s));

  // 4. Technology Extraction
  const techList = ['salesforce', 'braze', 'hubspot', 'adobe', 'oracle', 'python', 'sql', 'tableau'];
  const technologies = techList.filter(t => allText.includes(t));

  // 5. Industry Extraction
  const industryList = ['automotive', 'healthcare', 'consumer', 'retail', 'fmcg', 'technology', 'agency'];
  const industries = industryList.filter(i => allText.includes(i));

  // 6. Leadership Signals
  const leadershipSignalsList = ['p&l', 'profit and loss', 'ebitda', 'board of directors', 'reports to board', 'reports to ceo', 'direct reports', 'team of'];
  const leadershipSignals = leadershipSignalsList.filter(l => allText.includes(l));

  // 7. Company Attributes
  const companyAttrsList = ['series a', 'series b', 'series c', 'series d', 'funded', 'profitable', 'ipo', 'layoff', 'downsizing', 'hiring freeze'];
  const companyAttributes = companyAttrsList.filter(c => allText.includes(c));

  // 8. Employment type & travel requirements
  const employmentType = allText.includes('contract') ? 'Contract' : allText.includes('part time') ? 'Part-time' : 'Full-time';
  const travelRequirement = allText.includes('travel') ? 'Travel Required' : 'None';

  return {
    title: titleNorm,
    snippet: snippetNorm,
    location: raw.location,
    company: raw.company,
    titleTokens,
    snippetTokens,
    locationNorm: normalizeLocation(raw.location),
    companyNorm: normalizeCompany(raw.company),
    semanticData: raw.semanticData,
    seniority,
    functions,
    skills,
    technologies,
    industries,
    leadershipSignals,
    companyAttributes,
    locations: [normalizeLocation(raw.location)],
    employmentType,
    travelRequirement
  };
}
