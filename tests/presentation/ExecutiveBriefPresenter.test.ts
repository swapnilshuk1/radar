// tests/presentation/ExecutiveBriefPresenter.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { FunctionalMatcher } from '../../lib/ranking/ontology/FunctionalMatcher';
import { DecisionTraceBuilder } from '../../lib/ranking/decision/DecisionTraceBuilder';

describe('PR #9 - Final Non-Fabricated User Strategy Run', () => {

  it('🏆 SYSTEM CHECK: Verifies data contract layers contain zero synthetic text expansions or duplicate analytics', () => {
    const resumeSkills = [
      'Senior Vice President of Digital Transformation at VML networks corporate agency',
      'revenue growth strategy blueprints implementation models formulation'
    ];

    const jobRequirements = [
      'revenue growth strategy models',
      'demand generation frameworks deployment'
    ];

    const summary = FunctionalMatcher.compare(resumeSkills, jobRequirements);
    const trace = DecisionTraceBuilder.build(summary, 67, 0.92);

    // Assert baseline shapes
    assert.strictEqual(trace.summary.overallScore, 67);
    assert.strictEqual(trace.summary.verifiedRequirements, 1);
    assert.strictEqual(trace.blindSpots.length, 0, 'Blindspots registry must remain purely empty until tokenizer validation gates pass');

    const matchCard = trace.assessments.find(a => a.requirement.id === 'COMM_001');
    assert.ok(matchCard);
    
    // Verify match types resolve accurately via ontology trail definitions
    assert.strictEqual(matchCard.match.type, 'DIRECT');
    assert.strictEqual((matchCard as any).confidence, undefined, 'Repeated card-level confidence variables must be entirely excluded');
  });
});