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
    
    const candidateSkills = (profile.skills || []).map(s => s.toLowerCase());
    
    // Extracted target functional skills and tech from the job listing
    const jobSkills = [...job.skills, ...job.technologies];
    const jobFunctions = job.functions || [];

    let score = 0;
    let matchCount = 0;

    if (jobSkills.length > 0) {
      let missCount = 0;

      for (const skill of jobSkills) {
        // Resolve synonyms/clusters for the skill
        const synonyms = SkillGraphService.resolve(skill).map(s => s.toLowerCase());
        const hasSkill = synonyms.some(syn => 
          candidateSkills.includes(syn) || 
          (profile.resume?.rawText && profile.resume.rawText.toLowerCase().includes(syn))
        );

        if (hasSkill) {
          matchCount++;
          matched.push({
            id: `func_match_${skill.toLowerCase().replace(/\s+/g, '_')}`,
            label: `${skill} (matched)`,
            source: "resume",
            confidence: 0.95,
            weight: 10
          });
        } else {
          missCount++;
          missing.push({
            id: `func_miss_${skill.toLowerCase().replace(/\s+/g, '_')}`,
            label: skill,
            source: "resume",
            confidence: 0.8,
            weight: 10
          });
        }
      }

      // Calculate score based on ratio of matched required skills
      const matchRatio = matchCount / jobSkills.length;
      score = Math.round(matchRatio * 100);

      // Give partial credit if functional keywords match target titles and we have at least one matched skill
      if (score < 70 && matchCount > 0 && jobFunctions.some(f => profile.strategy?.targetTitles?.some(t => t.toLowerCase().includes(f)))) {
        score += 15;
      }
    } else {
      // If no explicit skills are extracted, evaluate based on general functional keywords matching target titles
      const matchesTargetFunction = jobFunctions.some(f => 
        profile.strategy?.targetTitles?.some(t => t.toLowerCase().includes(f))
      );
      score = matchesTargetFunction ? 45 : 35;

      if (matchesTargetFunction) {
        matched.push({
          id: "func_match_functional_role",
          label: `Aligned with target executive function: ${jobFunctions.slice(0, 2).join(', ')}`,
          source: "resume",
          confidence: 0.85,
          weight: 20
        });
      } else {
        missing.push({
          id: "func_miss_functional_role",
          label: "No matching target executive functions found in snippet",
          source: "resume",
          confidence: 0.7,
          weight: 20
        });
      }
    }

    // Bind score constraints between 0 and 100
    score = Math.min(Math.max(score, 0), 100);

    // Compute data sufficiency based on sum of skills and functions
    const totalExtracted = jobSkills.length + jobFunctions.length;
    let dataSufficiency: "low" | "medium" | "high" = "low";
    if (totalExtracted >= 3) {
      dataSufficiency = "high";
    } else if (totalExtracted >= 1) {
      dataSufficiency = "medium";
    } else {
      dataSufficiency = "low";
    }

    return {
      score,
      confidence: allTokens.length > 50 ? 0.95 : 0.6,
      matched: matched.slice(0, 5),
      missing: missing.slice(0, 5),
      explanation: matched.length > 0
        ? `Matched functional competencies: ${matched.map(m => m.label.replace(' (matched)', '')).slice(0, 2).join(', ')}.`
        : 'Limited functional skill matches identified. Expected competencies were missing.',
      metadata: {
        dataSufficiency,
        extractedSkills: jobSkills.length,
        extractedFunctions: jobFunctions.length,
        matchedSkills: matchCount,
        matchRatio: jobSkills.length > 0 ? parseFloat((matchCount / jobSkills.length).toFixed(4)) : 0
      }
    };
  }
}
