// tests/ranking/OntologyFoundation.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { OntologyResolver } from '../../lib/ranking/ontology/OntologyResolver';
import { FunctionalMatcher } from '../../lib/ranking/ontology/FunctionalMatcher';

describe('PR #7.1 - Marketing Capability Ontology Foundation Suite', () => {

  describe('Observable Behavioral Resolution Framework Checktracks', () => {
    it('should correctly strip structural grammar noise variations from observable outputs', () => {
      const output = OntologyResolver.resolveResume(['Led regional growth marketing execution']);
      assert.ok(output.length > 0, 'Should extract at least one matching capability node');
      assert.strictEqual(output[0].domain, 'COMMERCIAL_EXCELLENCE');
    });

    it('should cleanly resolve an active structural ontology phrase entry record', () => {
      const output = OntologyResolver.resolveResume(['Configured an enterprise CRM platform']);
      assert.ok(output.length > 0, 'Capability node must resolve successfully on precise vocabulary terms');
      assert.strictEqual(output[0].domain, 'CRM_CUSTOMER_LIFECYCLE');
    });

    it('should completely reject false-positive collisions based on shared single-word prefixes', () => {
      const output = OntologyResolver.resolveResume(['Expertise in managing general core corporate Sales Operations']);
      const matchesSalesforceNode = output.some(o => o.concept === 'Customer Data Platform' || o.matchedTerm === 'salesforce marketing cloud');
      assert.strictEqual(matchesSalesforceNode, false, 'Should isolate keyword prefix collisions cleanly');
    });
  });

  describe('FunctionalMatcher Multi-Axis Structural Profiles Crosscheck', () => {
    it('should populate accurate fractional mathematical coverage values based on requested capabilities', () => {
      const candidateSkills = ['Formulated long-term multi-market Growth Strategy blueprints', 'Built a performance marketing Centre of Excellence'];
      const jobRequirements = ['Seeking expertise in setting corporate Growth Strategy plans and managing Pricing Optimization matrices'];

      const summary = FunctionalMatcher.compare(candidateSkills, jobRequirements);

      assert.ok(summary.candidateProfile.length > 0);
      assert.ok(summary.jobProfile.length > 0);
      
      // Behavioral Assertion (>= 0.95): Demand-driven coverage effectively maps complete satisfaction of requested terms
      assert.ok(
        summary.domainCoverage.COMMERCIAL_EXCELLENCE >= 0.95, 
        `Expected high demand satisfaction score, got: ${summary.domainCoverage.COMMERCIAL_EXCELLENCE}`
      );
      assert.ok(summary.directDomainMatches.includes('COMMERCIAL_EXCELLENCE'));
    });
  });
});