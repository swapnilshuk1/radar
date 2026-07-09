// tests/ranking/Normalizer.test.ts
// Unit tests for Normalizer.ts — covers abbreviation expansion, alias resolution,
// normMeta confidence tagging, and termMatchesTokens.

import { normalize, termMatchesTokens } from '../../lib/ranking/Normalizer';

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

console.log('\n[Normalizer Tests]\n');

// ── termMatchesTokens ──────────────────────────────────────────────────────
console.log('termMatchesTokens:');
assert('finds single token',      termMatchesTokens('marketing', ['digital', 'marketing', 'vp']));
assert('finds multi-word term',   termMatchesTokens('chief marketing officer', ['chief', 'marketing', 'officer']));
assert('returns false on miss',   !termMatchesTokens('salesforce', ['crm', 'digital']));
assert('case-insensitive',        termMatchesTokens('CRM', ['crm', 'digital']));

// ── Abbreviation expansion ─────────────────────────────────────────────────
console.log('\nAbbreviation expansion:');
const vpJob = normalize({ title: 'VP Marketing', snippet: '', location: 'Delhi', company: 'Acme' });
assert('VP expanded to vice president in title',
  vpJob.title.includes('vice president'));

const cmoJob = normalize({ title: 'CMO Digital', snippet: '', location: 'Mumbai', company: 'Acme' });
assert('CMO expanded to chief marketing officer',
  cmoJob.title.includes('chief marketing officer'));

const crmJob = normalize({ title: 'Head CRM Strategy', snippet: 'martech and crm', location: 'Gurugram', company: 'Acme' });
assert('CRM expanded in snippet',
  crmJob.snippet.includes('customer relationship management'));

// ── Location alias resolution ──────────────────────────────────────────────
console.log('\nLocation alias resolution:');
const gurgaonJob = normalize({ title: 'Director', snippet: '', location: 'Gurgaon', company: 'Acme' });
assert('Gurgaon → gurugram',    gurgaonJob.locationNorm === 'gurugram');

const ncrJob = normalize({ title: 'Director', snippet: '', location: 'NCR', company: 'Acme' });
assert('NCR → delhi ncr',       ncrJob.locationNorm === 'delhi ncr');

const blrJob = normalize({ title: 'Director', snippet: '', location: 'Bangalore', company: 'Acme' });
assert('Bangalore → bengaluru', blrJob.locationNorm === 'bengaluru');

// ── Seniority inference ────────────────────────────────────────────────────
console.log('\nSeniority inference:');
const svpJob = normalize({ title: 'SVP Growth', snippet: '', location: 'Delhi', company: 'Acme' });
assert('SVP → svp seniority',         svpJob.seniority === 'svp');

const dirJob = normalize({ title: 'Director Marketing', snippet: '', location: 'Delhi', company: 'Acme' });
assert('Director → director seniority', dirJob.seniority === 'director');

const midJob = normalize({ title: 'Marketing Manager', snippet: '', location: 'Delhi', company: 'Acme' });
assert('Manager → mid seniority',      midJob.seniority === 'mid');

// ── normMeta confidence — structured fields ────────────────────────────────
console.log('\nnormMeta — structured fields:');
const structuredJob = normalize({ title: 'VP Marketing', snippet: '', location: 'Delhi', company: 'Acme Corp' });
assert('location confidence ≥ 0.88 from structured field',
  (structuredJob.normMeta?.location.confidence ?? 0) >= 0.88);
assert('location source = structured',
  structuredJob.normMeta?.location.source === 'structured');
assert('company confidence ≥ 0.85 from structured field',
  (structuredJob.normMeta?.company.confidence ?? 0) >= 0.85);
assert('seniority confidence = 0.92 from title token',
  structuredJob.normMeta?.seniority.confidence === 0.92);
assert('seniority source = structured',
  structuredJob.normMeta?.seniority.source === 'structured');

// ── normMeta confidence — inferred/empty fields ────────────────────────────
console.log('\nnormMeta — empty/inferred fields:');
const emptyLocJob = normalize({ title: 'Marketing Manager', snippet: '', location: '', company: '' });
assert('empty location → confidence = 0.45',
  emptyLocJob.normMeta?.location.confidence === 0.45);
assert('empty location → source = freetext',
  emptyLocJob.normMeta?.location.source === 'freetext');
assert('empty company → confidence = 0.30',
  emptyLocJob.normMeta?.company.confidence === 0.30);
assert('empty company → source = inferred',
  emptyLocJob.normMeta?.company.source === 'inferred');
assert('mid seniority → confidence = 0.40',
  emptyLocJob.normMeta?.seniority.confidence === 0.40);
assert('mid seniority → source = inferred',
  emptyLocJob.normMeta?.seniority.source === 'inferred');

// ── Employment type & travel ───────────────────────────────────────────────
console.log('\nEmployment type & travel:');
const contractJob = normalize({ title: 'Contract CMO', snippet: 'contract engagement', location: 'Delhi', company: 'Acme' });
assert('contract detected', contractJob.employmentType === 'Contract');

const travelJob = normalize({ title: 'VP', snippet: 'frequent travel required', location: 'Delhi', company: 'Acme' });
assert('travel detected', travelJob.travelRequirement === 'Travel Required');

const fullTimeJob = normalize({ title: 'Director Marketing', snippet: 'full time role', location: 'Delhi', company: 'Acme' });
assert('default full time', fullTimeJob.employmentType === 'Full-time');

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\n[Normalizer Tests] Results: Passed ${passed}/${passed + failed}`);
if (failed > 0) {
  console.error(`FAIL: ${failed} test(s) failed`);
  process.exit(1);
} else {
  console.log('SUCCESS: All Normalizer tests passed!');
}
