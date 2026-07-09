// lib/ranking/dimensions/TitleFit.ts
// Scores executive title alignment by evaluating title seniority and functional keywords.
// Fully expanded taxonomy covers Commerce, GTM, Strategy, CX, PMO, Communications, Analytics, and Operations leadership.

import { Evaluator, EvaluationContext, EvaluationDimension, MatchEvidence } from '../types';
import { termMatchesTokens } from '../Normalizer';

export class TitleFitScorer implements Evaluator {
  readonly dimensionName = 'titleFit'; // UI Label: "Executive Seniority"

  score(context: EvaluationContext): EvaluationDimension {
    const job = context.job;
    const profile = context.candidate;
    const titleTokens = job.titleTokens;

    const matched: MatchEvidence[] = [];
    const missing: MatchEvidence[] = [];
    let score = 0;
    let explanation = 'No significant title alignment found.';

    const targetTitles = profile.strategy?.targetTitles || [];
    
    // 1. Direct Target Title Phrase match
    for (const term of targetTitles) {
      if (termMatchesTokens(term, titleTokens)) {
        score = 100;
        matched.push({
          id: `title_direct_${term.toLowerCase().replace(/\s+/g, '_')}`,
          label: `Direct Target Match: "${term}"`,
          source: "resume",
          confidence: 1.0,
          weight: 100
        });
        explanation = `Matches target title list: "${term}".`;
        break;
      }
    }

    // 2. Inferred Executive Role match with expanded functional and leadership taxonomy
    if (score === 0) {
      const executiveLevels = [
        'director', 'vp', 'vice president', 'svp', 'chief', 'head', 'lead', 
        'leader', 'president', 'partner', 'principal', 'manager', 'hub', 'managing'
      ];
      
      const functionalKeywords = [
        'marketing', 'crm', 'cdp', 'martech', 'digital', 'transformation', 
        'ecommerce', 'commerce', 'commercial', 'brand', 'growth', 'sales', 
        'strategy', 'strategic', 'gtm', 'product', 'program', 'pmo', 'business', 
        'alliance', 'alliances', 'client', 'performance', 'innovation', 'acquisition',
        'enablement', 'generation', 'demand', 'media', 'planning', 'solutions',
        'communication', 'communications', 'operations', 'customer', 'analytics', 
        'success', 'satisfaction', 'experience'
      ];

      const matchedLevel = executiveLevels.find(level => termMatchesTokens(level, titleTokens));
      const matchedFunction = functionalKeywords.find(fn => termMatchesTokens(fn, titleTokens));

      if (matchedLevel && matchedFunction) {
        score = 85;
        matched.push({
          id: `title_inferred_${matchedLevel}_${matchedFunction}`,
          label: `Executive Role: ${matchedLevel} of ${matchedFunction}`,
          source: "job",
          confidence: 0.9,
          weight: 85
        });
        explanation = `Matches inferred executive role: "${matchedLevel}" in "${matchedFunction}" domain.`;
      }
    }

    // 3. Word-level overlap fallback
    if (score === 0 && targetTitles.length > 0) {
      const strongMatches = targetTitles.slice(0, 5);
      for (const term of strongMatches) {
        const words = term.toLowerCase().split(/\s+/);
        const overlap = words.filter(w => titleTokens.includes(w));
        if (overlap.length > 0 && overlap.length >= Math.ceil(words.length / 2)) {
          score = 65;
          matched.push({
            id: `title_overlap_${term.toLowerCase().replace(/\s+/g, '_')}`,
            label: `Overlap: "${term}"`,
            source: "resume",
            confidence: 0.8,
            weight: 65
          });
          explanation = `Partial overlap matched for: "${term}".`;
          break;
        }
      }
    }

    if (score === 0 && targetTitles.length > 0) {
      missing.push({
        id: "missing_executive_title",
        label: targetTitles[0],
        source: "resume",
        confidence: 0.9,
        weight: 100
      });
    }

    return {
      score,
      confidence: titleTokens.length > 0 ? 1.0 : 0.0,
      matched,
      missing,
      explanation
    };
  }
}
