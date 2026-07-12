// lib/ranking/ontology/CompetencyMatcher.ts
import { MarketingOntology, CompetencyId, CandidateCapability } from './data';

export interface CompetencyResolutionResult {
  competencyId: CompetencyId;
  label: string;
  matched: string[];
  missing: string[];
  evidence: string[]; // Pass pure descriptive proofs upward for UI explainability
  coverage: number;   // Pure raw float value (e.g. 0.66666667)
}

export class CompetencyMatcher {
  private static reverseIndex: Map<string, CompetencyId> = new Map();
  private static initialized = false;

  private static buildIndex(): void {
    if (this.initialized) return;
    for (const id of Object.keys(MarketingOntology) as CompetencyId[]) {
      const node = MarketingOntology[id];
      for (const alias of node.aliases) {
        this.reverseIndex.set(alias.toLowerCase().trim(), id);
      }
    }
    this.initialized = true;
  }

  /**
   * Resolves raw extracted keywords straight into descriptive capability facts.
   */
  public static resolve(
    jdTerms: string[], 
    profile: Record<CompetencyId, CandidateCapability>
  ): CompetencyResolutionResult[] {
    this.buildIndex();

    const bucketedDemands: Record<CompetencyId, string[]> = {} as any;
    for (const term of jdTerms) {
      const compId = this.reverseIndex.get(term.toLowerCase().trim());
      if (compId) {
        if (!bucketedDemands[compId]) bucketedDemands[compId] = [];
        bucketedDemands[compId].push(term);
      }
    }

    const resolutions: CompetencyResolutionResult[] = [];

    for (const compId of Object.keys(bucketedDemands) as CompetencyId[]) {
      const demands = bucketedDemands[compId];
      const ontologyNode = MarketingOntology[compId];
      const candidateCap = profile[compId];

      const matched: string[] = [];
      const missing: string[] = [];
      const evidence = candidateCap ? candidateCap.rawEvidenceDescriptions : [];

      const lowerCandidateEvidence = candidateCap 
        ? candidateCap.evidenceTerms.map(e => e.toLowerCase().trim()) 
        : [];

      for (const demand of demands) {
        if (lowerCandidateEvidence.includes(demand.toLowerCase().trim())) {
          matched.push(demand);
        } else {
          missing.push(demand);
        }
      }

      const totalDemands = matched.length + missing.length;
      const coverage = totalDemands > 0 ? matched.length / totalDemands : 0;

      resolutions.push({
        competencyId: compId,
        label: ontologyNode.label,
        matched,
        missing,
        evidence,
        coverage // Pure unrounded float value preserved for upstream evaluation handling
      });
    }

    return resolutions;
  }
}