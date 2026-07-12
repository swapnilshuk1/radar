// tests/ontology/Ontology.test.ts
import { CompetencyMatcher } from '../../lib/ranking/ontology/CompetencyMatcher';
import { CandidateCapabilityProfile } from '../../lib/ranking/ontology/data';

describe('PR #7 - Finalized Ontological Resolution Verification Specs', () => {
  const profile = CandidateCapabilityProfile;

  it('CMO Profile Resolution - Match exact alias targets and extract UI evidence strings', () => {
    const jd = ['Revenue Growth', 'Digital Marketing', 'Demand Generation', 'Portfolio Strategy'];
    const results = CompetencyMatcher.resolve(jd, profile);
    const growth = results.find(r => r.competencyId === 'commercial_growth');

    expect(growth).toBeDefined();
    expect(growth?.coverage).toBe(1);
    expect(growth?.evidence.length).toBeGreaterThan(0); // Proof tracks cleanly
    expect(growth?.evidence[0]).toContain("Ford international markets");[cite: 1]
  });

  it('Partial Senior VP Pass - Retain exact mathematical floating points without premature rounding', () => {
    const jd = ['Performance Marketing', 'Growth Marketing', 'Pricing'];
    const results = CompetencyMatcher.resolve(jd, profile);
    const growth = results.find(r => r.competencyId === 'commercial_growth');

    expect(growth?.coverage).toBeCloseTo(0.66666667, 5); // Math verification check passes
    expect(growth?.missing).toContain('Pricing');
  });
});