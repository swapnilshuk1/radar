// tests/ranking/DecisionEngine.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DecisionScorer } from '../../lib/ranking/decision/DecisionScorer';
import { DecisionRecommendationEngine } from '../../lib/ranking/decision/DecisionRecommendationEngine';
import { DecisionOverridePolicy } from '../../lib/ranking/decision/DecisionOverridePolicy';
import { DecisionEngine } from '../../lib/ranking/DecisionEngine';
import { RecommendationEnum, VerdictEnum, FitVector } from '../../lib/ranking/types';
import { DecisionCategory, ENGINE_ERRORS } from '../../lib/ranking/decision/types';

describe('PR #6.1 - Decoupled Core Architecture Validation Matrix', () => {

  // 1. PURE MATH CORE UNIT SCORER TESTS
  describe('Component 1: DecisionScorer Mathematical Boundaries', () => {
    it('should compute proportional composite scores with multi-axis dimensions', () => {
      const sampleVector: FitVector = {
        titleFit: { score: 95, confidence: 1.0 },
        leadershipFit: { score: 90, confidence: 1.0 },
        functionalFit: { score: 85, confidence: 1.0 },
        locationFit: { score: 90, confidence: 1.0 },
        industryFit: { score: 0, confidence: 0 }
      };
      
      const card = DecisionScorer.score(sampleVector);
      
      // Using native node assertions with flexible range bounds to protect against weight drift
      assert.ok(card.compositeScore > 60, `Score ${card.compositeScore} should be greater than 60`);
      assert.ok(card.compositeScore < 80, `Score ${card.compositeScore} should be less than 80`);
    });
  });

  // 2. STRATEGIC OUTCOME THRESHOLD BRACKETS
  describe('Component 2: DecisionRecommendationEngine Strategic Thresholds', () => {
    it('should route core scores to correct workflow brackets without logic coupling', () => {
      const applyOutcome = DecisionRecommendationEngine.recommend(88);
      assert.strictEqual(applyOutcome.recommendation, RecommendationEnum.APPLY);
      assert.strictEqual(applyOutcome.category, DecisionCategory.APPLY);

      const monitorOutcome = DecisionRecommendationEngine.recommend(58);
      assert.strictEqual(monitorOutcome.recommendation, RecommendationEnum.MONITOR);
      assert.strictEqual(monitorOutcome.category, DecisionCategory.WATCH);
    });
  });

  // 3. STATELESS CORPORATE POLICY VETO GATES
  describe('Component 3: DecisionOverridePolicy Binary Ceilings', () => {
    it('should dynamically identify policy violations on hard requirement mismatches', () => {
      const failingVector: FitVector = {
        hardRequirementFit: { score: 20, confidence: 1.0 }
      } as any;

      const policy = DecisionOverridePolicy.evaluate(failingVector);
      assert.strictEqual(policy.applied, true);
      
      const hasMismatchCode = policy.violations.some(v => v.code === 'HARD_REQUIREMENT_MISMATCH');
      assert.strictEqual(hasMismatchCode, true, 'Should contain HARD_REQUIREMENT_MISMATCH code mapping');
    });
  });

  // 4. PIPELINE INTEGRATION ORCHESTRATION & FAIL FAST INVARIANTS
  describe('Component 4: Orchestrator Integration & Boundary Verification', () => {
    it('should successfully pass a valid V2 Normalized Input envelope through the entire chain', () => {
      const mockEnvelope = {
        fitVector: {
          titleFit: { score: 80, confidence: 1.0 },
          leadershipFit: { score: 70, confidence: 1.0 },
          functionalFit: { score: 75, confidence: 1.0 },
          locationFit: { score: 80, confidence: 1.0 },
          industryFit: { score: 0, confidence: 0 }
        },
        ruleId: "INTEGRATION_TEST_SPEC",
        verdict: VerdictEnum.WORTH_REVIEWING,
        recommendation: RecommendationEnum.MONITOR,
        reasons: [],
        dataSource: "SERVER"
      };

      const model = DecisionEngine.evaluateV2(mockEnvelope as any);
      assert.ok(model.compositeScore > 50, `Composite score ${model.compositeScore} should be > 50`);
      assert.ok(model.compositeScore < 65, `Composite score ${model.compositeScore} should be < 65`);
      assert.ok(model.strengths !== undefined, 'Strengths collection structural array layout must be initialized');
    });

    it('should aggressively fail-fast if a caller bypasses the envelope structure completely', () => {
      const rawVectorOnly = { titleFit: { score: 90 } };
      
      // Asserts that the gateway cleanly throws the centralized error object on bad API payloads
      assert.throws(() => {
        DecisionEngine.evaluateV2(rawVectorOnly as any);
      }, new RegExp(ENGINE_ERRORS.INVALID_INPUT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    });
  });
});