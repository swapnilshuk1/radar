// lib/ranking/PriorityClassifier.ts
// Classifies a matchScore (0–100) into one of 5 meaningful priority tiers.
// Thresholds are fully configurable via agg.json priority_thresholds.

import { PriorityTier } from './types';
import { getRankingConfig } from './config';

export class PriorityClassifier {
  static classify(matchScore: number): PriorityTier {
    const thresholds = getRankingConfig().priority_thresholds;

    if (matchScore >= thresholds.must_review)     return 'Must Review';
    if (matchScore >= thresholds.strong_match)    return 'Strong Match';
    if (matchScore >= thresholds.worth_reviewing) return 'Worth Reviewing';
    if (matchScore >= thresholds.possible_match)  return 'Possible Match';
    return 'Low Priority';
  }
}
