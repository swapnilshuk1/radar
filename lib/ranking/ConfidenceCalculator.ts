// lib/ranking/ConfidenceCalculator.ts
// Calculates confidence in the ranking based on information richness.
// Confidence depends on: snippet word count, matched dimension count, matched signal count.
// This produces an explainable confidence score — not just "high/medium/low".

import { RankingDimension, ConfidenceResult } from './types';

export class ConfidenceCalculator {
  static calculate(
    breakdown: RankingDimension[],
    snippetWordCount: number,
    totalMatchedSignals: number
  ): ConfidenceResult {
    let score = 0;
    const factors: string[] = [];

    // Factor 1: Snippet richness
    if (snippetWordCount > 100) {
      score += 0.4;
      factors.push(`${snippetWordCount}-word listing`);
    } else if (snippetWordCount >= 40) {
      score += 0.2;
      factors.push(`${snippetWordCount}-word listing`);
    } else {
      factors.push(`short ${snippetWordCount}-word listing`);
    }

    // Factor 2: Number of dimensions with positive scores
    const dimensionsWithSignal = breakdown.filter(d => d.rawScore > 0).length;
    if (dimensionsWithSignal >= 4) {
      score += 0.3;
      factors.push(`${dimensionsWithSignal} dimensions matched`);
    } else if (dimensionsWithSignal >= 2) {
      score += 0.15;
      factors.push(`${dimensionsWithSignal} dimensions matched`);
    }

    // Factor 3: Total matched signals
    if (totalMatchedSignals > 5) {
      score += 0.3;
      factors.push(`${totalMatchedSignals} signals identified`);
    } else if (totalMatchedSignals >= 2) {
      score += 0.15;
      factors.push(`${totalMatchedSignals} signals identified`);
    }

    score = Math.min(score, 1.0);

    const level: 'HIGH' | 'MEDIUM' | 'LOW' =
      score >= 0.7 ? 'HIGH' :
      score >= 0.4 ? 'MEDIUM' : 'LOW';

    const basis = `Assessed on ${factors.join(', ')}`;

    return { level, score, basis };
  }
}
