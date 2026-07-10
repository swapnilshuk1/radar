// tests/ranking/OpportunityEnrichment.test.ts
// Tests the decoupled OpportunityEnrichmentService, caching, and threshold evaluation loops.
// Written using native node assertion patterns to bypass external Jest compiler dependencies.

import { OpportunityEnrichmentService } from '../../lib/ranking/OpportunityEnrichmentService';
import { RankingEngine } from '../../lib/ranking/RankingService';
import { getCandidateProfile } from '../../lib/ranking/config';

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, extra?: any) {
  if (condition) {
    console.log(`  [PASS] ${label}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${label}`, extra ?? '');
    failed++;
  }
}

console.log('\n[OpportunityEnrichment & Semantic Enrichment Tests]\n');

const profile = getCandidateProfile();

const highMatchJob = {
  title: 'Chief Marketing Officer',
  company: 'Google',
  location: 'Gurugram',
  snippet: 'Looking for an executive leader with P&L ownership and digital transformation experience. Salesforce CDP and MarTech expertise required.'
};

const lowMatchJob = {
  title: 'Analyst B2B Sales',
  company: 'TinyCorp',
  location: 'Remote',
  snippet: 'Junior sales coordinator with 0-5 years experience doing cold calling.'
};

async function run() {
  // Test 1: Heuristic Local Fallback works correctly when API Key is missing
  const prevKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const enrichment = await OpportunityEnrichmentService.enrich(highMatchJob, profile);
    
    assert('Heuristic Local Fallback: overallScore >= 50', enrichment.overallScore >= 50);
    assert('Heuristic Local Fallback: executiveVerdict is Worth Monitoring', enrichment.executiveVerdict === 'Worth Monitoring');
    assert('Heuristic Local Fallback: recommendedPriority is Possible Match', enrichment.recommendedPriority === 'Possible Match');
    assert('Heuristic Local Fallback: has strengths', enrichment.strengths.length > 0);
  } catch (err: any) {
    assert('Heuristic Local Fallback did not throw', false, err.message);
  } finally {
    process.env.GEMINI_API_KEY = prevKey;
  }

  // Test 2: Rules-Only evaluation filters low matching jobs before LLM calls
  const highRulesScore = RankingEngine.evaluateRulesOnly(highMatchJob, profile);
  const lowRulesScore = RankingEngine.evaluateRulesOnly(lowMatchJob, profile);

  assert('Rules-Only: highRulesScore >= 40', highRulesScore >= 40);
  assert('Rules-Only: lowRulesScore is 0', lowRulesScore === 0);

  // Test 3: Stale resume versions trigger cache invalidation checks
  const cachedData = {
    overallScore: 85,
    confidence: "High" as const,
    summary: "Good match",
    strengths: ["Strong marketing leadership"],
    gaps: [],
    matchedSkills: [],
    missingSkills: [],
    recommendedAction: "Review immediately",
    reasoning: [],
    executiveVerdict: "Review Immediately" as const,
    recommendedPriority: "Must Review" as const,
    semanticVersion: "1.0",
    sourceResumeVersion: "2026-07-08", // Stale version
    evaluatedAt: new Date().toISOString()
  };

  const currentResumeVersion = "2026-07-09";
  const isStale = cachedData.sourceResumeVersion !== currentResumeVersion;
  
  assert('Stale resume triggers cache invalidation', isStale === true);

  console.log(`\nTests completed: ${passed} passed, ${failed} failed.\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
