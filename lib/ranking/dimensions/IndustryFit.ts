// lib/ranking/dimensions/IndustryFit.ts
// Scores Industry Fit by comparing structural dimensions:
// Business Model, Customer Type, Digital Maturity, and Enterprise Scale rather than simple keywords.

import { Evaluator, EvaluationContext, EvaluationDimension, MatchEvidence } from '../types';
import { termMatchesTokens } from '../Normalizer';

export class IndustryFitScorer implements Evaluator {
  readonly dimensionName = 'industryFit'; // UI Label: "Industry Experience"

  score(context: EvaluationContext): EvaluationDimension {
    const job = context.job;
    const profile = context.candidate;
    const allTokens = [...job.titleTokens, ...job.snippetTokens];

    const matched: MatchEvidence[] = [];
    const missing: MatchEvidence[] = [];
    let matchedCount = 0;
    const details: string[] = [];

    // 1. Customer Type (B2C / D2C alignment)
    const b2cKeywords = ['b2c', 'd2c', 'consumer', 'retail', 'fmcg', 'direct to consumer', 'automotive', 'car', 'vehicle', 'patient', 'user', 'customer'];
    const isB2C = b2cKeywords.some(kw => termMatchesTokens(kw, allTokens));
    if (isB2C) {
      matchedCount++;
      details.push('B2C / Consumer model alignment');
      matched.push({
        id: "industry_b2c",
        label: "B2C / Consumer Customer Type",
        source: "resume",
        confidence: 0.9,
        weight: 25
      });
    }

    // 2. Digital Maturity & Transformation Complexity
    const transformKeywords = ['transformation', 'legacy', 'migration', 'modernization', 'restructure', 'transition', 'cdp', 'crm', 'salesforce'];
    const isTransform = transformKeywords.some(kw => termMatchesTokens(kw, allTokens));
    if (isTransform) {
      matchedCount++;
      details.push('High transformation complexity');
      matched.push({
        id: "industry_transform_complexity",
        label: "Digital Transformation Scope",
        source: "resume",
        confidence: 0.95,
        weight: 30
      });
    }

    // 3. Enterprise Scale
    const scaleKeywords = ['scale', 'global', 'regional', 'crore', 'million', 'billion', 'national', 'cross-functional', 'gcc'];
    const isEnterpriseScale = scaleKeywords.some(kw => termMatchesTokens(kw, allTokens));
    if (isEnterpriseScale) {
      matchedCount++;
      details.push('Enterprise scale match');
      matched.push({
        id: "industry_scale",
        label: "Enterprise Scale Alignment",
        source: "resume",
        confidence: 0.85,
        weight: 25
      });
    }

    // 4. Preferred Core Industry match fallback
    const targetIndustries = profile.preferences?.industries || [];
    let matchedCore = false;
    for (const ind of targetIndustries) {
      if (termMatchesTokens(ind, allTokens)) {
        matchedCount++;
        matchedCore = true;
        details.push(`${ind} domain match`);
        matched.push({
          id: `industry_core_${ind.toLowerCase()}`,
          label: `${ind} Industry Context`,
          source: "resume",
          confidence: 1.0,
          weight: 20
        });
        break;
      }
    }

    if (!matchedCore && targetIndustries.length > 0) {
      missing.push({
        id: "missing_core_industry",
        label: targetIndustries[0],
        source: "resume",
        confidence: 0.7,
        weight: 20
      });
    }

    // Score is based on matching structural indices (max 100)
    const score = Math.min(matchedCount * 25, 100);

    return {
      score,
      confidence: allTokens.length > 30 ? 0.85 : 0.5,
      matched,
      missing,
      explanation: matchedCount > 0
        ? `Inferred industry parameters: ${details.join(', ')}.`
        : 'Limited industry model alignment detected.'
    };
  }
}
