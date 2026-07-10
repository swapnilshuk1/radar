// tests/ranking/HardRequirementScorer.test.ts
// Unit tests for HardRequirementScorer.ts — covers cache hits, stale resume version misses,
// offline rules-gating fallbacks, and score allocations.

import { HardRequirementScorer } from '../../lib/ranking/dimensions/HardRequirementScorer';
import { getCandidateProfile } from '../../lib/ranking/config';
import { normalize } from '../../lib/ranking/Normalizer';
import { EvaluationContext, RecommendationEnum, VerdictEnum } from '../../lib/ranking/types';
import { DecisionEngine } from '../../lib/ranking/DecisionEngine';

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

console.log('\n[HardRequirementScorer Tests]\n');

const scorer = new HardRequirementScorer();
const profile = getCandidateProfile();
const currentResumeVersion = profile.resume?.sourceResumeVersion || "unknown";

// Test 1: Offline Fallback when semanticData is missing
const jobWithoutSem = normalize({
  title: 'CMO - Digital Transformation',
  snippet: 'MarTech experience required.',
  location: 'Gurugram',
  company: 'Acme',
  semanticData: null
});

const context1: EvaluationContext = {
  job: jobWithoutSem,
  candidate: profile,
  config: {}
};

const res1 = scorer.score(context1);
assert('Returns fallback score of 70 when semanticData is null', res1.score === 70);
assert('Returns fallback confidence of 0.3', res1.confidence === 0.3);
assert('Explanation notes check is unavailable', res1.explanation.includes('unavailable'));

// Test 2: Offline Fallback when skipLlmCheck is true (even if semanticData is present)
const jobWithSem = normalize({
  title: 'CMO - Digital Transformation',
  snippet: 'MarTech experience required.',
  location: 'Gurugram',
  company: 'Acme',
  semanticData: '{}' // empty json
});

const context2: EvaluationContext = {
  job: jobWithSem,
  candidate: profile,
  config: {},
  skipLlmCheck: true
};

const res2 = scorer.score(context2);
assert('Returns fallback score of 70 when skipLlmCheck is true', res2.score === 70);

// Test 3: Cache Hit from semanticData
const jobWithCache = normalize({
  title: 'CMO - Digital Transformation',
  snippet: 'MarTech experience required.',
  location: 'Gurugram',
  company: 'Acme',
  semanticData: JSON.stringify({
    sourceResumeVersion: currentResumeVersion,
    hardMismatches: ["Named certification X", "app-based marketing"]
  })
});

const context3: EvaluationContext = {
  job: jobWithCache,
  candidate: profile,
  config: {}
};

const res3 = scorer.score(context3);
assert('Cache hit returns score 20 when mismatches present', res3.score === 20);
assert('Returns 2 missing evidence blocks', res3.missing.length === 2);
assert('Confidence is 0.7 on cache hit', res3.confidence === 0.7);
assert('Matches labels in missing evidence', res3.missing[0].label === 'Named certification X');

// Test 4: Cache hit with empty list (meaning no mismatches)
const jobWithNoMismatches = normalize({
  title: 'CMO - Digital Transformation',
  snippet: 'MarTech experience required.',
  location: 'Gurugram',
  company: 'Acme',
  semanticData: JSON.stringify({
    sourceResumeVersion: currentResumeVersion,
    hardMismatches: []
  })
});

const context4: EvaluationContext = {
  job: jobWithNoMismatches,
  candidate: profile,
  config: {}
};

const res4 = scorer.score(context4);
assert('Cache hit returns score 100 when mismatches list is empty', res4.score === 100);
assert('Matched/missing lists are empty', res4.matched.length === 0 && res4.missing.length === 0);

// Test 5: Cache invalidation when sourceResumeVersion is stale
const jobWithStaleResume = normalize({
  title: 'CMO - Digital Transformation',
  snippet: 'MarTech experience required.',
  location: 'Gurugram',
  company: 'Acme',
  semanticData: JSON.stringify({
    sourceResumeVersion: "stale-version-999",
    hardMismatches: ["app-based marketing"]
  })
});

const context5: EvaluationContext = {
  job: jobWithStaleResume,
  candidate: profile,
  config: {},
  skipLlmCheck: true // will trigger fallback on cache miss instead of LLM
};

const res5 = scorer.score(context5);
assert('Stale resume cache miss triggers fallback when skipLlmCheck is true', res5.score === 70);

// Test 6: DecisionEngine override rule
const fitVectorWithMismatch = {
  titleFit: { score: 95, confidence: 0.9, matched: [], missing: [], explanation: '' },
  leadershipFit: { score: 90, confidence: 0.9, matched: [], missing: [], explanation: '' },
  functionalFit: { score: 90, confidence: 0.9, matched: [], missing: [], explanation: '' },
  locationFit: { score: 90, confidence: 0.9, matched: [], missing: [], explanation: '' },
  hardRequirementFit: { score: 20, confidence: 0.7, matched: [], missing: [], explanation: 'mismatch' }
};

const decisionRes = DecisionEngine.evaluate(fitVectorWithMismatch);
assert('DecisionEngine triggers HARD_REQ_OVERRIDE on hard requirement mismatch (score <= 30)', decisionRes.ruleId === 'HARD_REQ_OVERRIDE');
assert('Verdict is WORTH_REVIEWING on override', decisionRes.verdict === VerdictEnum.WORTH_REVIEWING);
assert('Recommendation is MONITOR on override', decisionRes.recommendation === RecommendationEnum.MONITOR);
assert('Reasons list contains HARD_REQUIREMENT_MISMATCH', decisionRes.reasons?.includes('HARD_REQUIREMENT_MISMATCH') === true);

console.log(`\nTests completed: ${passed} passed, ${failed} failed.\n`);
process.exit(failed > 0 ? 1 : 0);
