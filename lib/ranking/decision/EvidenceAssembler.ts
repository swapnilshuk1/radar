// lib/ranking/decision/EvidenceAssembler.ts
import { FitVector } from '../types';
import { EvidencePiece } from './types';
import { EvidenceCatalog } from './catalog';

export class EvidenceAssembler {
  /**
   * Decoupled Compiler: Evaluates multi-dimensional vectors directly against thresholds
   */
  public static assemble(fitVector: FitVector, targetType: 'strength' | 'gap'): EvidencePiece[] {
    const pieces: EvidencePiece[] = [];

    // Map internal structure properties safely to basic match strings
    const scoreMap: Record<string, number> = {
      title: fitVector?.titleFit?.score ?? 0,
      leadership: fitVector?.leadershipFit?.score ?? 0,
      functional: fitVector?.functionalFit?.score ?? 0,
      location: fitVector?.locationFit?.score ?? 0,
      career: fitVector?.careerProgressionFit?.score ?? 0,
      company: fitVector?.companyHealth?.score ?? 0
    };

    // Scan every catalog item against the live dimensions
    for (const key in EvidenceCatalog) {
      const template = EvidenceCatalog[key];
      if (template.type !== targetType) continue;

      const currentScore = scoreMap[template.dimension];

      // If it clears the threshold check, bake the telemetry metadata piece
      if (template.threshold(currentScore)) {
        const satisfaction = template.type === "strength" ? currentScore : Math.max(0, 100 - currentScore);
        const contribution = Math.round((template.priority * satisfaction) / 10);

        pieces.push({
          code: template.code,
          priority: template.priority,
          satisfaction,
          contribution
        });
      }
    }

    // Sort descending by calculated contribution mass
    return pieces.sort((a, b) => b.contribution - a.contribution);
  }
}