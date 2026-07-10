// tests/ranking/Evaluators.test.ts
// Unit tests for all ranking evaluator scorers.
// Each evaluator is tested with a match case, a miss case, and a boundary case.

import { normalize } from '../../lib/ranking/Normalizer';
import { getCandidateProfile } from '../../lib/ranking/config';
import { EvaluationContext } from '../../lib/ranking/types';

import { TitleFitScorer }            from '../../lib/ranking/dimensions/TitleFit';
import { SeniorityFitScorer }        from '../../lib/ranking/dimensions/SeniorityFit';
import { FunctionalFitScorer }       from '../../lib/ranking/dimensions/FunctionalFit';
import { LocationScorer }            from '../../lib/ranking/dimensions/LocationScorer';
import { IndustryFitScorer }         from '../../lib/ranking/dimensions/IndustryFit';
import { ExecutiveSignalsScorer }     from '../../lib/ranking/dimensions/ExecutiveSignals';
import { CompanyResolver }           from '../../lib/ranking/dimensions/CompanyResolver';

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

function ctx(title: string, snippet = '', location = 'Delhi NCR', company = 'Acme'): EvaluationContext {
  return {
    job: normalize({ title, snippet, location, company, semanticData: null }),
    candidate: getCandidateProfile(),
    config: {}
  };
}

console.log('\n[Evaluator Tests]\n');

const titleScorer = new TitleFitScorer();
const seniorityScorer = new SeniorityFitScorer();
const functionalScorer = new FunctionalFitScorer();
const locationScorer = new LocationScorer();
const industryScorer = new IndustryFitScorer();
const execScorer = new ExecutiveSignalsScorer();
const companyScorer = new CompanyResolver();

// ── TitleFit ───────────────────────────────────────────────────────────────
console.log('TitleFitScorer:');
{
  const r = titleScorer.score(ctx('Chief Marketing Officer'));
  assert('CMO strong match → score ≥ 80', r.score >= 80);
  assert('has matched evidence', r.matched.length > 0);
}
{
  const r = titleScorer.score(ctx('VP Marketing'));
  assert('VP Marketing → score ≥ 70', r.score >= 70);
}
{
  const r = titleScorer.score(ctx('Junior Data Entry Clerk'));
  assert('unrelated title → score = 0', r.score === 0);
  assert('has missing evidence', r.missing.length > 0);
}

// ── SeniorityFit ───────────────────────────────────────────────────────────
console.log('\nSeniorityFitScorer:');
{
  const r = seniorityScorer.score(ctx('SVP Growth Marketing'));
  assert('SVP → high score ≥ 70', r.score >= 70);
}
{
  const r = seniorityScorer.score(ctx('Marketing Executive'));
  assert('executive → non-zero score', r.score > 0);
}
{
  const r = seniorityScorer.score(ctx('Marketing Intern'));
  assert('intern → low score ≤ 30', r.score <= 30);
}

// ── FunctionalFit ──────────────────────────────────────────────────────────
console.log('\nFunctionalFitScorer:');
{
  const r = functionalScorer.score(ctx('VP CRM Marketing', 'salesforce crm migration strategy martech'));
  assert('CRM + martech → score ≥ 50', r.score >= 50);
  assert('has matched terms', r.matched.length > 0);
  assert('metadata contains dataSufficiency', typeof r.metadata?.dataSufficiency === 'string');
  assert('metadata contains extractedSkills', typeof r.metadata?.extractedSkills === 'number');
}
{
  const r = functionalScorer.score(ctx('Director Finance', 'balance sheets and treasury management'));
  assert('finance-only → score is exactly 35', r.score === 35);
  assert('finance-only → dataSufficiency is low', r.metadata?.dataSufficiency === 'low');
}
{
  const r = functionalScorer.score(ctx('VP Marketing', 'growth and brand activation'));
  assert('marketing function without skills → score is exactly 45', r.score === 45);
  assert('marketing function without skills → dataSufficiency is medium', r.metadata?.dataSufficiency === 'medium');
}

// ── LocationScorer ─────────────────────────────────────────────────────────
console.log('\nLocationScorer:');
{
  const r = locationScorer.score(ctx('VP Marketing', '', 'Gurugram'));
  assert('Gurugram → preferred location → score ≥ 80', r.score >= 80);
}
{
  const r = locationScorer.score(ctx('VP Marketing', '', 'pune'));
  assert('Pune → preferred location → score > 0', r.score > 0);
}
{
  const r = locationScorer.score(ctx('VP Marketing', '', 'Hyderabad'));
  assert('Hyderabad → non-preferred → score < 80', r.score < 80);
}
{
  const r = locationScorer.score(ctx('VP Marketing', 'remote work from home', 'Anywhere'));
  assert('remote signal → score > 0', r.score > 0);
}

// ── IndustryFit ────────────────────────────────────────────────────────────
console.log('\nIndustryFitScorer:');
{
  const r = industryScorer.score(ctx('VP Marketing', 'automotive retail consumer brand', 'Delhi'));
  assert('automotive + consumer → score > 0', r.score > 0);
}
{
  const r = industryScorer.score(ctx('VP Marketing', 'deep sea mining operations', 'Delhi'));
  assert('irrelevant industry → score = 0', r.score === 0);
}

// ── ExecutiveSignals ───────────────────────────────────────────────────────
console.log('\nExecutiveSignalsScorer:');
{
  const r = execScorer.score(ctx('VP Marketing', 'p&l ownership ebitda board of directors', 'Delhi'));
  // Baseline is 50 for sub-dimensions. With board/p&l matches, it calculates to a positive score.
  assert('P&L + EBITDA + board → score > 0', r.score > 0);
  assert('matched signals present', r.matched.length > 0);
}
{
  const r = execScorer.score(ctx('Marketing Specialist', 'create content and manage social media', 'Delhi'));
  assert('no exec signals → default baseline score > 0', r.score > 0);
}

// ── CompanyResolver ────────────────────────────────────────────────────────
console.log('\nCompanyResolverScorer:');
{
  const r = companyScorer.score(ctx('VP Marketing', '', 'Delhi', 'Google'));
  assert('tier-1 company → score ≥ 80', r.score >= 80);
}
{
  const r = companyScorer.score(ctx('VP Marketing', '', 'Delhi', 'Hindustan Unilever'));
  assert('HUL (tier-1) → score ≥ 80', r.score >= 80);
}
{
  const r = companyScorer.score(ctx('VP Marketing', '', 'Delhi', 'Random Startup XYZ'));
  assert('unknown company → default score > 0', r.score > 0);
}

// ── Confidence and explanation presence ───────────────────────────────────
console.log('\nAll evaluators — structural invariants:');
const evaluators = [
  { name: 'TitleFit',        fn: (c: EvaluationContext) => titleScorer.score(c) },
  { name: 'SeniorityFit',    fn: (c: EvaluationContext) => seniorityScorer.score(c) },
  { name: 'FunctionalFit',   fn: (c: EvaluationContext) => functionalScorer.score(c) },
  { name: 'LocationScorer',  fn: (c: EvaluationContext) => locationScorer.score(c) },
  { name: 'IndustryFit',     fn: (c: EvaluationContext) => industryScorer.score(c) },
  { name: 'ExecutiveSignals',fn: (c: EvaluationContext) => execScorer.score(c) },
  { name: 'CompanyResolver', fn: (c: EvaluationContext) => companyScorer.score(c) },
];

const baseCtx = ctx('VP Digital Marketing', 'crm salesforce automotive p&l', 'Gurugram', 'Google');
for (const ev of evaluators) {
  const r = ev.fn(baseCtx);
  assert(`${ev.name}: score in [0, 100]`, r.score >= 0 && r.score <= 100);
  assert(`${ev.name}: confidence in [0, 1]`, r.confidence >= 0 && r.confidence <= 1);
  assert(`${ev.name}: explanation is string`, typeof r.explanation === 'string');
  assert(`${ev.name}: matched is array`, Array.isArray(r.matched));
  assert(`${ev.name}: missing is array`, Array.isArray(r.missing));
}

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\n[Evaluator Tests] Results: Passed ${passed}/${passed + failed}`);
if (failed > 0) {
  console.error(`FAIL: ${failed} test(s) failed`);
  process.exit(1);
} else {
  console.log('SUCCESS: All evaluator tests passed!');
}
