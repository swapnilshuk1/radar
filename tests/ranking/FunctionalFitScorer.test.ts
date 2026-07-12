// tests/ranking/FunctionalFitScorer.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { FunctionalFitScorer } from '../../lib/ranking/decision/FunctionalFitScorer';
import { OntologyResolver } from '../../lib/ranking/ontology/OntologyResolver';

describe('PR #7 - Consolidated Ontology & Intelligence Validation Matrix', () => {

  describe('Ontology Quality Semantic Regression Tracks', () => {
    it('should match core conceptual variants accurately', () => {
      const output = OntologyResolver.resolveResume(['revenue growth strategy models']);
      assert.ok(output.length > 0, 'Should extract matching capability node');
      assert.strictEqual(output[0].conceptId, 'COMM_001');
    });

    it('should actively protect boundaries against unrelated semantic expansions', () => {
      const output = OntologyResolver.resolveResume(['Fostered an internal corporate team growth mindset environment']);
      const hasRevenueMatch = output.some(o => o.conceptId === 'COMM_001');
      assert.strictEqual(hasRevenueMatch, false, 'Protected against false positive semantic overlap');
    });
  });

  describe('Consolidated Multi-Role Executive Mandate Verification Matrices', () => {
    const canonicalSVPResume = [
      'Senior Vice President of Digital Transformation at VML network agency',
      'revenue growth strategy blueprints implementation',
      'operating model design governance playbooks',
      'demand generation frameworks infrastructure setup'
    ];

    it('🏆 GOLDEN REGRESSION: Resolves historical executive CMO matching vectors via true capability traces', () => {
      const targetExecutiveCmoJob = [
        'revenue growth strategy models',
        'operating model design governance',
        'demand generation frameworks deployment'
      ];

      const card = FunctionalFitScorer.score(canonicalSVPResume, targetExecutiveCmoJob);

      // Verifies score matches the business evaluation expectations
      assert.ok(card.score > 70, `CMO capability score must clear business evaluation floor. Got: ${card.score}`);
      assert.ok(card.matched.includes('COMMERCIAL_EXCELLENCE'), 'Should contain Commercial Excellence');
      
      // 🔄 Fixed: Updated reference path to point to the correct frozen trace schema layer
      assert.ok(card.trace.ontology.matchedConcepts.includes('COMM_001'), 'Should explicitly verify concept COMM_001 via trace');
    });

    it('should compute proportional fractional penalties on partially missing domains', () => {
      const candidateSkills = ['performance marketing coe scaling tracks'];
      
      const jobRequirements = [
        'coe setup blueprints',
        'full p&l accountability guidelines'
      ];

      const card = FunctionalFitScorer.score(candidateSkills, jobRequirements);

      assert.ok(card.score >= 40 && card.score <= 60, `Score should reflect precise 50% capability coverage, got: ${card.score}`);
      assert.ok(card.matched.includes('DIGITAL_TRANSFORMATION'), 'Should match Digital Transformation');
    });

    it('should gracefully handle empty baseline fallback scenarios cleanly without loss of metadata structure', () => {
      const card = FunctionalFitScorer.score([], []);
      assert.strictEqual(card.score, 45, 'Empty requirements must return baseline fallback signature of 45');
      assert.ok(card.trace.artifacts.evidenceTraces !== undefined, 'Trace trails must remain accessible');
    });
  });
});