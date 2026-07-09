// lib/ranking/dimensions/LocationScorer.ts
// Scores Location Fit by comparing preferences and hybrid/remote flexibility signals.
// Implements self-healing scan to extract location keywords from description if raw location is missing.

import { Evaluator, EvaluationContext, EvaluationDimension, MatchEvidence } from '../types';
import { termMatchesTokens } from '../Normalizer';

export class LocationScorer implements Evaluator {
  readonly dimensionName = 'locationFit'; // UI Label: "Location Preference"

  score(context: EvaluationContext): EvaluationDimension {
    const job = context.job;
    const profile = context.candidate;
    const locationTokens = job.locationNorm.toLowerCase().split(/\s+/);
    const allTokens = [...job.titleTokens, ...job.snippetTokens];

    const matched: MatchEvidence[] = [];
    const missing: MatchEvidence[] = [];
    let score = 0;
    let explanation = 'Preferred locations not matched.';

    const preferredLocations = profile.preferences?.locations || [];

    // 1. Direct Location match check (from structured location data)
    if (job.locationNorm && job.locationNorm.trim() !== '') {
      for (const loc of preferredLocations) {
        if (termMatchesTokens(loc, locationTokens)) {
          score = 100;
          explanation = `Location matches your preference: "${loc}".`;
          matched.push({
            id: `location_direct_${loc.toLowerCase().replace(/\s+/g, '_')}`,
            label: loc,
            source: "resume",
            confidence: 1.0,
            weight: 100
          });
          break;
        }
      }
    }

    // 2. Self-Healing Fallback: Scan job description text for locations if raw location is missing
    if (score === 0) {
      for (const loc of preferredLocations) {
        if (termMatchesTokens(loc, allTokens)) {
          score = 85;
          explanation = `Location extracted from job description context: "${loc}".`;
          matched.push({
            id: `location_inferred_${loc.toLowerCase().replace(/\s+/g, '_')}`,
            label: `${loc} (inferred from description)`,
            source: "job",
            confidence: 0.85,
            weight: 85
          });
          break;
        }
      }
    }

    // 3. Hybrid / Remote flexibility fallback
    if (score === 0) {
      const remoteSignals = ['remote', 'hybrid', 'wfh', 'work from home', 'flexible location'];
      for (const signal of remoteSignals) {
        if (termMatchesTokens(signal, allTokens)) {
          score = 80;
          explanation = `Flexible work options matched: "${signal}".`;
          matched.push({
            id: `location_remote_${signal.toLowerCase().replace(/\s+/g, '_')}`,
            label: `Flexible Options (${signal})`,
            source: "job",
            confidence: 0.9,
            weight: 80
          });
          break;
        }
      }
    }

    if (score === 0 && preferredLocations.length > 0) {
      missing.push({
        id: "missing_preferred_location",
        label: preferredLocations[0],
        source: "resume",
        confidence: 1.0,
        weight: 100
      });
    }

    return {
      score,
      confidence: job.locationNorm.trim() !== '' ? 1.0 : 0.6,
      matched,
      missing,
      explanation
    };
  }
}
