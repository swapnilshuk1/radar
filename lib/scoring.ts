// lib/scoring.ts
// Backward compatibility barrel — PRESERVED, do not delete.
// Gradually migrate direct importers to lib/ranking/RankingService.ts
//
// This file allows existing import paths (import { scoreJob } from '@/lib/scoring')
// to continue resolving while the codebase migrates to the new ranking engine.

export { RankingEngine } from './ranking/RankingService';
export type {
  RankingResult,
  RankingExplanation,
  RankingDimension,
  RankingDimensionProvider,
  CandidateProfile,
  JobInput,
  NormalizedJob,
  PriorityTier,
  OpportunityInsights,
  ConfidenceResult
} from './ranking/types';
export { getConfig, getCandidateProfile, getRankingConfig } from './ranking/config';
