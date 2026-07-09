// lib/ranking/dimensions/CompanyResolver.ts
// Scores Company Health across five granular dimensions: Growth, Financial Stability, Leadership Stability, Hiring Momentum, and Market Reputation.

import { Evaluator, EvaluationContext, EvaluationDimension, MatchEvidence } from '../types';
import { termMatchesTokens } from '../Normalizer';

export class CompanyResolver implements Evaluator {
  readonly dimensionName = 'companyHealth'; // UI Label: "Company Health"

  score(context: EvaluationContext): EvaluationDimension {
    const job = context.job;
    const allTokens = [...job.titleTokens, ...job.snippetTokens];

    const matched: MatchEvidence[] = [];
    const missing: MatchEvidence[] = [];

    // Detailed Health parameters (Scale 0-100)
    let growth = 70;
    let financialStability = 70;
    let leadershipStability = 80;
    let hiringMomentum = 70;
    let marketReputation = 65;

    // 1. Growth checks
    const growthKeywords = ['series a', 'series b', 'series c', 'series d', 'growth', 'profitable', 'ipo', 'funded'];
    if (growthKeywords.some(kw => termMatchesTokens(kw, allTokens))) {
      growth = 90;
      hiringMomentum = 85;
      matched.push({
        id: "health_growth",
        label: "High Financial Growth",
        source: "job",
        confidence: 0.9,
        weight: 20
      });
    }

    // 2. Layoffs / Restructure checks (Financial and Leadership Stability drop)
    const distressKeywords = ['layoff', 'downsizing', 'hiring freeze', 'restructuring', 'freeze'];
    if (distressKeywords.some(kw => termMatchesTokens(kw, allTokens))) {
      financialStability = 40;
      hiringMomentum = 30;
      leadershipStability = 50;
      missing.push({
        id: "health_distress",
        label: "Layoffs / Organizational Restructuring Warning",
        source: "job",
        confidence: 0.95,
        weight: 30
      });
    }

    // 3. Premium brand reputation bonus
    const premiumBrands = ['google', 'microsoft', 'amazon', 'unilever', 'tata', 'mckinsey', 'reliance', 'ford', 'bmw'];
    const isPremium = premiumBrands.some(brand => job.company.toLowerCase().includes(brand));
    if (isPremium) {
      marketReputation = 95;
      financialStability = 90;
      matched.push({
        id: "health_premium_brand",
        label: `Premium Brand Stability (${job.company})`,
        source: "job",
        confidence: 1.0,
        weight: 20
      });
    }

    // Overall Company Health score is the average of these 5 dimensions
    const score = Math.round((growth + financialStability + leadershipStability + hiringMomentum + marketReputation) / 5);

    return {
      score,
      confidence: job.company.trim() !== '' ? 0.9 : 0.4,
      matched,
      missing,
      explanation: `Company Health: Growth (${growth}%), Stability (${financialStability}%), Leadership (${leadershipStability}%), Hiring Velocity (${hiringMomentum}%), Brand Reputation (${marketReputation}%).`,
      metadata: {
        health: {
          growth,
          financialStability,
          leadershipStability,
          hiringMomentum,
          marketReputation
        }
      }
    };
  }
}
