// lib/ranking/dimensions/ExecutiveSignals.ts
// Career Trajectory Fit evaluator.
// Evaluates career progression across four key dimensions: Promotion, Scope, Brand, and Strategic Exposure.

import { Evaluator, EvaluationContext, EvaluationDimension, MatchEvidence } from '../types';
import { termMatchesTokens } from '../Normalizer';

export class ExecutiveSignalsScorer implements Evaluator {
  readonly dimensionName = 'careerProgressionFit'; // UI Label: "Career Trajectory"

  score(context: EvaluationContext): EvaluationDimension {
    const job = context.job;
    const profile = context.candidate;
    const allTokens = [...job.titleTokens, ...job.snippetTokens];

    const matched: MatchEvidence[] = [];
    const missing: MatchEvidence[] = [];

    // Progression Dimension Scores
    let promotion = 50; // Baseline lateral
    let scope = 50;
    let brand = 50;
    let strategicExposure = 50;

    // 1. Promotion (Title seniority comparison)
    const targetTitles = profile.strategy?.targetTitles || [];
    const isTargetSeniorTitle = targetTitles.some(term => termMatchesTokens(term, job.titleTokens));
    if (isTargetSeniorTitle) {
      promotion = 90;
      matched.push({
        id: "prog_promotion",
        label: "Title Promotion Path",
        source: "resume",
        confidence: 0.9,
        weight: 25
      });
    }

    // 2. Scope (P&L and team scale match)
    if (job.leadershipSignals.includes('p&l') || job.leadershipSignals.includes('direct reports')) {
      scope = 85;
      matched.push({
        id: "prog_scope",
        label: "Expanded Operational Scope",
        source: "job",
        confidence: 0.85,
        weight: 25
      });
    }

    // 3. Brand Equity (Employer quality comparison)
    const premiumCompanies = ['google', 'microsoft', 'amazon', 'unilever', 'tata', 'mckinsey', 'reliance', 'ford', 'bmw'];
    const isPremium = premiumBrandsMatch(job.company, premiumCompanies);
    if (isPremium) {
      brand = 95;
      matched.push({
        id: "prog_brand",
        label: `Premium Brand Equity (${job.company})`,
        source: "job",
        confidence: 0.95,
        weight: 25
      });
    }

    // 4. Strategic Exposure (Board interaction / GCC / Transformation scope)
    const transformKeywords = ['transformation', 'legacy', 'migration', 'reports to board', 'board of directors'];
    const hasExposure = transformKeywords.some(kw => termMatchesTokens(kw, allTokens));
    if (hasExposure) {
      strategicExposure = 80;
      matched.push({
        id: "prog_exposure",
        label: "Board & Strategic Transformation Exposure",
        source: "job",
        confidence: 0.8,
        weight: 25
      });
    }

    // Overall career fit score is the average of these 4 sub-dimensions
    const score = Math.round((promotion + scope + brand + strategicExposure) / 4);

    return {
      score,
      confidence: job.titleTokens.length > 0 ? 0.9 : 0.5,
      matched,
      missing,
      explanation: `Career progression metrics inferred: Promotion (${promotion}%), Brand Equity (${brand}%), Operational Scope (${scope}%), Strategic Exposure (${strategicExposure}%).`,
      metadata: {
        progression: {
          promotion,
          scope,
          brand,
          strategicExposure
        }
      }
    };
  }
}

function premiumBrandsMatch(company: string, premium: string[]): boolean {
  const lower = company.toLowerCase().trim();
  return premium.some(c => lower.includes(c));
}
