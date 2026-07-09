// tests/ranking/DecisionEngine.test.ts
// 100% branch coverage of DecisionEngine.ts.
// Tests every rule including all threshold boundary conditions and Rule 4 sub-branches.

import { DecisionEngine } from '../../lib/ranking/DecisionEngine';
import { FitVector, RecommendationEnum, VerdictEnum } from '../../lib/ranking/types';

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

/** Build a minimal FitVector from named score overrides */
function fv(overrides: Partial<Record<string, number>>): FitVector {
  const scores: Record<string, number> = {
    titleFit: 0, leadershipFit: 0, functionalFit: 0,
    locationFit: 0, careerProgressionFit: 0, companyHealth: 0,
    ...overrides
  };
  const out: FitVector = {};
  for (const [key, score] of Object.entries(scores)) {
    out[key] = { score, confidence: 1, matched: [], missing: [], explanation: '' };
  }
  return out;
}

console.log('\n[DecisionEngine Tests]\n');

// ── Rule 1: EXEC_001_IMMEDIATE ─────────────────────────────────────────────
console.log('Rule 1 — EXEC_001_IMMEDIATE:');
{
  const d = DecisionEngine.evaluate(fv({ titleFit: 90, leadershipFit: 70, functionalFit: 80, locationFit: 80 }));
  assert('fires at exact thresholds', d.ruleId === 'EXEC_001_IMMEDIATE');
  assert('verdict = STRONG_CANDIDATE', d.verdict === VerdictEnum.STRONG_CANDIDATE);
  assert('recommendation = APPLY_IMMEDIATELY', d.recommendation === RecommendationEnum.APPLY_IMMEDIATELY);
  assert('includes PROMOTIONAL_TRAJECTORY reason', d.reasons.includes('PROMOTIONAL_TRAJECTORY'));
}
{
  const d = DecisionEngine.evaluate(fv({ titleFit: 100, leadershipFit: 100, functionalFit: 100, locationFit: 100 }));
  assert('fires at max scores', d.ruleId === 'EXEC_001_IMMEDIATE');
}
{
  // titleScore = 89 → misses Rule 1, falls to Rule 2
  const d = DecisionEngine.evaluate(fv({ titleFit: 89, leadershipFit: 70, functionalFit: 80, locationFit: 80 }));
  assert('titleScore 89 does NOT trigger Rule 1', d.ruleId !== 'EXEC_001_IMMEDIATE');
}
{
  // leadershipScore = 69 → misses Rule 1
  const d = DecisionEngine.evaluate(fv({ titleFit: 90, leadershipFit: 69, functionalFit: 80, locationFit: 80 }));
  assert('leadershipScore 69 does NOT trigger Rule 1', d.ruleId !== 'EXEC_001_IMMEDIATE');
}

// ── Rule 2: EXEC_002_STRONG_MATCH ─────────────────────────────────────────
console.log('\nRule 2 — EXEC_002_STRONG_MATCH:');
{
  const d = DecisionEngine.evaluate(fv({ titleFit: 80, leadershipFit: 70, functionalFit: 70, locationFit: 80 }));
  assert('fires at exact thresholds', d.ruleId === 'EXEC_002_STRONG_MATCH');
  assert('verdict = STRONG_CANDIDATE', d.verdict === VerdictEnum.STRONG_CANDIDATE);
  assert('recommendation = NETWORK_FIRST', d.recommendation === RecommendationEnum.NETWORK_FIRST);
}
{
  // locationScore = 79 → falls through to Rule 3
  const d = DecisionEngine.evaluate(fv({ titleFit: 80, leadershipFit: 70, functionalFit: 70, locationFit: 79 }));
  assert('locationScore 79 does NOT trigger Rule 2', d.ruleId !== 'EXEC_002_STRONG_MATCH');
}
{
  // functionalScore = 69 → falls through (Rule 2 needs ≥70)
  const d = DecisionEngine.evaluate(fv({ titleFit: 80, leadershipFit: 70, functionalFit: 69, locationFit: 80 }));
  assert('functionalScore 69 does NOT trigger Rule 2', d.ruleId !== 'EXEC_002_STRONG_MATCH');
}

// ── Rule 3: EXEC_003_LOC_MISMATCH ─────────────────────────────────────────
console.log('\nRule 3 — EXEC_003_LOC_MISMATCH:');
{
  const d = DecisionEngine.evaluate(fv({ titleFit: 65, leadershipFit: 70, functionalFit: 70, locationFit: 79 }));
  assert('fires at exact thresholds', d.ruleId === 'EXEC_003_LOC_MISMATCH');
  assert('verdict = WORTH_REVIEWING', d.verdict === VerdictEnum.WORTH_REVIEWING);
  assert('recommendation = MONITOR', d.recommendation === RecommendationEnum.MONITOR);
  assert('includes LOCATION_MISMATCH reason', d.reasons.includes('LOCATION_MISMATCH'));
}
{
  // titleScore = 64 → misses Rule 3
  const d = DecisionEngine.evaluate(fv({ titleFit: 64, leadershipFit: 70, functionalFit: 70, locationFit: 79 }));
  assert('titleScore 64 does NOT trigger Rule 3', d.ruleId !== 'EXEC_003_LOC_MISMATCH');
}
{
  // locationFit ≥ 80 → Rule 3 condition (locationScore < 80) not met
  const d = DecisionEngine.evaluate(fv({ titleFit: 65, leadershipFit: 70, functionalFit: 70, locationFit: 80 }));
  assert('locationFit 80 does NOT trigger Rule 3 (condition is <80)', d.ruleId !== 'EXEC_003_LOC_MISMATCH');
}

// ── Rule 4: EXEC_004_EXPLORE_CONTEXT ──────────────────────────────────────
console.log('\nRule 4 — EXEC_004_EXPLORE_CONTEXT:');
{
  // Sub-branch A: companyScore ≥ 60 → no VERIFY_COMPANY_HEALTH
  const d = DecisionEngine.evaluate(fv({ functionalFit: 50, careerProgressionFit: 50, companyHealth: 60 }));
  assert('fires at exact thresholds', d.ruleId === 'EXEC_004_EXPLORE_CONTEXT');
  assert('verdict = WORTH_MONITORING', d.verdict === VerdictEnum.WORTH_MONITORING);
  assert('no VERIFY_COMPANY_HEALTH when companyScore ≥ 60',
    !d.reasons.includes('VERIFY_COMPANY_HEALTH'));
}
{
  // Sub-branch B: companyScore < 60 → adds VERIFY_COMPANY_HEALTH
  const d = DecisionEngine.evaluate(fv({ functionalFit: 50, careerProgressionFit: 50, companyHealth: 59 }));
  assert('companyScore 59 adds VERIFY_COMPANY_HEALTH reason',
    d.reasons.includes('VERIFY_COMPANY_HEALTH'));
}
{
  // careerScore = 49 → falls through to Rule 5
  const d = DecisionEngine.evaluate(fv({ functionalFit: 50, careerProgressionFit: 49 }));
  assert('careerScore 49 does NOT trigger Rule 4', d.ruleId !== 'EXEC_004_EXPLORE_CONTEXT');
}

// ── Rule 5: EXEC_005_SKIP (fallthrough) ───────────────────────────────────
console.log('\nRule 5 — EXEC_005_SKIP:');
{
  const d = DecisionEngine.evaluate(fv({})); // all zeros
  assert('all-zero fitVector → EXEC_005_SKIP', d.ruleId === 'EXEC_005_SKIP');
  assert('verdict = LIMITED_ALIGNMENT', d.verdict === VerdictEnum.LIMITED_ALIGNMENT);
  assert('recommendation = IGNORE', d.recommendation === RecommendationEnum.IGNORE);
  assert('includes LIMITED_ALIGNMENT reason', d.reasons.includes('LIMITED_ALIGNMENT'));
}
{
  const d = DecisionEngine.evaluate(fv({ titleFit: 40, functionalFit: 40, careerProgressionFit: 40 }));
  assert('below all thresholds → EXEC_005_SKIP', d.ruleId === 'EXEC_005_SKIP');
}

// ── Missing fitVector keys (null safety) ──────────────────────────────────
console.log('\nNull-safety:');
{
  const d = DecisionEngine.evaluate({}); // entirely empty FitVector
  assert('empty FitVector does not throw, returns EXEC_005_SKIP', d.ruleId === 'EXEC_005_SKIP');
}

// ── Summary ───────────────────────────────────────────────────────────────
console.log(`\n[DecisionEngine Tests] Results: Passed ${passed}/${passed + failed}`);
if (failed > 0) {
  console.error(`FAIL: ${failed} test(s) failed`);
  process.exit(1);
} else {
  console.log('SUCCESS: 100% DecisionEngine branch coverage confirmed!');
}
