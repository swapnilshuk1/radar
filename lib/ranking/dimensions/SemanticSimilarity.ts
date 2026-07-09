// lib/ranking/dimensions/SemanticSimilarity.ts
// Deprecated / Reserved for future custom semantic evaluations.

import { Evaluator, EvaluationContext, EvaluationDimension } from '../types';

export class SemanticSimilarityScorer implements Evaluator {
  readonly dimensionName = 'semanticSimilarity';

  score(context: EvaluationContext): EvaluationDimension {
    return {
      score: 100,
      confidence: 1.0,
      matched: [],
      missing: [],
      explanation: 'V3.1 Semantic match bypassed in favor of deterministic scoring.'
    };
  }
}
