// lib/ranking/dimensions/SeniorityFit.ts
// Inferred Seniority & Leadership Scale evaluator.
// Infers executive seniority from structural indicators (budget, P&L, board exposure, team scale).

import { Evaluator, EvaluationContext, EvaluationDimension, MatchEvidence } from '../types';
import { termMatchesTokens } from '../Normalizer';

export class SeniorityFitScorer implements Evaluator {
  readonly dimensionName = 'leadershipFit'; // UI Label: "Leadership Scale"

  score(context: EvaluationContext): EvaluationDimension {
    const job = context.job;
    const profile = context.candidate;
    const allTokens = [...job.titleTokens, ...job.snippetTokens];

    const matched: MatchEvidence[] = [];
    const missing: MatchEvidence[] = [];
    let matchedCount = 0;
    const details: string[] = [];

    // 1. P&L Ownership
    const plKeywords = ['p&l', 'profit and loss', 'ebitda', 'profit centre', 'revenue ownership', 'budget'];
    const hasPL = plKeywords.some(kw => termMatchesTokens(kw, allTokens));
    if (hasPL) {
      matchedCount++;
      details.push('P&L / Budget control');
      if (profile.experience.plOwnership) {
        matched.push({
          id: "leadership_pl",
          label: "P&L Ownership",
          source: "resume",
          confidence: 1.0,
          weight: 20
        });
      }
    } else if (profile.experience.plOwnership) {
      missing.push({
        id: "missing_pl_scope",
        label: "Explicit P&L Ownership",
        source: "resume",
        confidence: 0.7,
        weight: 20
      });
    }

    // 2. Board Interaction
    const boardKeywords = ['board of directors', 'reports to board', 'executive committee', 'ceo reports', 'present to board', 'board briefing'];
    const hasBoard = boardKeywords.some(kw => termMatchesTokens(kw, allTokens));
    if (hasBoard) {
      matchedCount++;
      details.push('Board governance access');
      if (profile.experience.boardInteraction) {
        matched.push({
          id: "leadership_board",
          label: "Board Exposure",
          source: "resume",
          confidence: 0.95,
          weight: 20
        });
      }
    } else if (profile.experience.boardInteraction) {
      missing.push({
        id: "missing_board_briefing",
        label: "Board Reporting Scope",
        source: "resume",
        confidence: 0.6,
        weight: 20
      });
    }

    // 3. Team Management Scale
    const teamKeywords = ['direct reports', 'team of', 'manage a team', 'reporting line', 'leadership role', 'governance model'];
    const hasTeam = teamKeywords.some(kw => termMatchesTokens(kw, allTokens));
    if (hasTeam) {
      matchedCount++;
      details.push('Team scale alignment');
      if (profile.experience.teamSizeManaged > 10) {
        matched.push({
          id: "leadership_team",
          label: `Team management scale (target: ${profile.experience.teamSizeManaged})`,
          source: "resume",
          confidence: 0.8,
          weight: 30
        });
      }
    }

    // 4. Decision Authority
    const authorityKeywords = ['decision authority', 'sign-off', 'strategic direction', 'steer', 'oversight', 'lead capability'];
    const hasAuthority = authorityKeywords.some(kw => termMatchesTokens(kw, allTokens));
    if (hasAuthority) {
      matchedCount++;
      details.push('Strategic decision authority');
      matched.push({
        id: "leadership_authority",
        label: "Commercial Leadership Authority",
        source: "resume",
        confidence: 0.85,
        weight: 30
      });
    }

    // 5. Seniority Level Comparison (V4.0 Core Match)
    let seniorityScore = 50; // Baseline
    if (job.seniority === 'svp') {
      seniorityScore = 90; // Step up target
    } else if (job.seniority === 'vp') {
      seniorityScore = 95; // Lateral match
    } else if (job.seniority === 'director') {
      seniorityScore = 80; // Slightly junior but strong management scope
    } else if (job.seniority === 'mid') {
      seniorityScore = 30; // Mismatch
    }

    // Final Score: Combine seniority hierarchy base and structural indicator bonuses
    const indicatorBonus = matchedCount * 5; // e.g. up to +20 points for P&L, Board, Team scale, Authority details
    const score = Math.min(Math.max(seniorityScore + indicatorBonus, 0), 100);

    return {
      score,
      confidence: allTokens.length > 30 ? 0.9 : 0.4,
      matched,
      missing,
      explanation: matchedCount > 0 
        ? `Matched leadership seniority: ${job.seniority.toUpperCase()} level with indicators: ${details.join(', ')}.` 
        : `Matched leadership seniority: ${job.seniority.toUpperCase()} level.`
    };
  }
}
