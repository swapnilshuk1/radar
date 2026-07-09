// lib/ranking/dimensions/FunctionalFit.ts
// Scores Functional Fit by evaluating both positive matched evidence and negative missing signals.
// Utilizes strongly-typed entities and resolves skill taxonomy.

import { Evaluator, EvaluationContext, EvaluationDimension, MatchEvidence } from '../types';
import { SkillGraphService } from '../SkillGraphService';
import { termMatchesTokens } from '../Normalizer';

export class FunctionalFitScorer implements Evaluator {
  readonly dimensionName = 'functionalFit'; // UI Label: "Functional Expertise"

  score(context: EvaluationContext): EvaluationDimension {
    const job = context.job;
    const profile = context.candidate;
    const allTokens = [...job.titleTokens, ...job.snippetTokens];

    const matched: MatchEvidence[] = [];
    const missing: MatchEvidence[] = [];
    
    // Core requirements from Candidate Profile
    const candidateSkills = profile.skills || [];
    
    let baseScore = 60; // Starting baseline
    const matchedClusters = new Set<string>();

    for (const skill of candidateSkills) {
      const expanded = SkillGraphService.resolve(skill);
      let foundTerm: string | null = null;

      for (const term of expanded) {
        if (termMatchesTokens(term, allTokens)) {
          foundTerm = term;
          break;
        }
      }

      if (foundTerm) {
        matchedClusters.add(skill.toLowerCase());
        baseScore += 8; // Gained points for positive match
        matched.push({
          id: `func_match_${skill.toLowerCase().replace(/\s+/g, '_')}`,
          label: `${skill} (matched via: "${foundTerm}")`,
          source: "resume",
          confidence: 0.95,
          weight: 8
        });
      } else {
        baseScore -= 6; // Lost points for missing expected skill
        missing.push({
          id: `func_miss_${skill.toLowerCase().replace(/\s+/g, '_')}`,
          label: skill,
          source: "resume",
          confidence: 0.8,
          weight: 6
        });
      }
    }

    // Bind score constraints between 0 and 100
    const score = Math.min(Math.max(baseScore, 0), 100);

    return {
      score,
      confidence: allTokens.length > 50 ? 0.95 : 0.6,
      matched: matched.slice(0, 5),
      missing: missing.slice(0, 5),
      explanation: matchedClusters.size > 0
        ? `Matched functional competencies: ${Array.from(matchedClusters).slice(0, 2).join(', ')}. Gaps penalize overall scoring.`
        : 'Limited functional skill matches identified. Expected competencies were missing.'
    };
  }
}
