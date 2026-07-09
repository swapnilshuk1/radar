// lib/ranking/InsightsGenerator.ts
// Decoupled post-processing step that generates human-readable Opportunity Insights
// from a completed RankingExplanation without requiring an LLM.
//
// Architecture note: This is intentionally separated from the ranking engine so that
// the rule-based summary generation here can later be replaced with LLM-generated
// summaries (e.g. Gemini/GPT) by simply swapping this module — no engine changes needed.

import { RankingDimension, OpportunityInsights, RankingExplanation } from './types';
import { NormalizedJob } from './types';

const STRENGTH_THRESHOLD = 0.6;
const CONCERN_THRESHOLD  = 0.2;

function buildSummary(
  breakdown: RankingDimension[],
  job: NormalizedJob,
  matchScore: number
): string {
  const titleDim    = breakdown.find(d => d.name === 'Title Fit');
  const seniorityDim = breakdown.find(d => d.name === 'Seniority Fit');
  const funcDim     = breakdown.find(d => d.name === 'Functional Fit');
  const locationDim = breakdown.find(d => d.name === 'Location Preference');

  const parts: string[] = [];

  if (titleDim && titleDim.rawScore >= 0.8) {
    parts.push(`Strong executive title alignment (${titleDim.matchedTerms[0] || job.title})`);
  } else if (titleDim && titleDim.rawScore >= 0.5) {
    parts.push(`Partial title mandate match (${titleDim.matchedTerms[0] || job.title})`);
  } else {
    parts.push(`Title does not directly match core mandates`);
  }

  if (seniorityDim && seniorityDim.rawScore >= 0.76) {
    parts.push('suitable seniority level');
  } else if (seniorityDim && seniorityDim.rawScore >= 0.5) {
    parts.push('mid-level seniority');
  }

  if (funcDim && funcDim.rawScore >= 0.5) {
    parts.push('relevant functional domain signals present');
  }

  if (locationDim && locationDim.rawScore >= 0.8) {
    parts.push('preferred geography');
  } else if (locationDim && locationDim.matchedTerms.some(t => t.includes('flexible'))) {
    parts.push('flexible/remote location possible');
  } else {
    parts.push('outside preferred geography');
  }

  const scoreLabel = matchScore >= 80 ? 'Excellent' : matchScore >= 65 ? 'Strong' : matchScore >= 50 ? 'Moderate' : 'Weak';
  return `${scoreLabel} match. ${parts.join(', ')}.`;
}

function extractStrengths(breakdown: RankingDimension[]): string[] {
  return breakdown
    .filter(d => d.rawScore >= STRENGTH_THRESHOLD)
    .sort((a, b) => b.rawScore - a.rawScore)
    .slice(0, 4)
    .map(d => {
      const terms = d.matchedTerms.slice(0, 2).join(', ');
      return terms
        ? `${d.name}: ${terms}`
        : `${d.name} matches target profile`;
    });
}

function extractConcerns(breakdown: RankingDimension[]): string[] {
  return breakdown
    .filter(d => d.rawScore < CONCERN_THRESHOLD && d.weight >= 10)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map(d => {
      if (d.missedTerms.length > 0) {
        return `${d.name}: missing ${d.missedTerms.slice(0, 2).join(', ')}`;
      }
      return `${d.name} not well matched`;
    });
}

/**
 * Generate Opportunity Insights from a completed ranking explanation.
 * This is a post-processing step, decoupled from the ranking engine.
 * Replace the body of this function to swap in LLM-generated summaries.
 */
export function generateInsights(
  explanation: Omit<RankingExplanation, 'insights'>,
  job: NormalizedJob
): OpportunityInsights {
  const { breakdown, matchScore, matchedSignals, missingSignals } = explanation;

  return {
    summary: buildSummary(breakdown, job, matchScore),
    topStrengths: extractStrengths(breakdown),
    potentialConcerns: extractConcerns(breakdown),
    matchedKeywords: matchedSignals.slice(0, 12),
    missingKeywords: missingSignals.slice(0, 6)
  };
}
