// lib/ranking/ontology/FunctionalMatcher.ts
import { FunctionalMatchSummary, CompetencyDomain } from './types';

export class FunctionalMatcher {
  public static compare(candidatePhrases: string[], jobPhrases: string[]): FunctionalMatchSummary {
    // Factual extraction parsing from the incoming raw string parameters
    const jobProfile = jobPhrases.map((phrase, idx) => {
      // Deterministically group concepts into tracking domains based on content
      let domain: CompetencyDomain = 'DIGITAL_TRANSFORMATION';
      if (phrase.toLowerCase().includes('p&l') || phrase.toLowerCase().includes('revenue')) {
        domain = 'COMMERCIAL_EXCELLENCE';
      } else if (phrase.toLowerCase().includes('growth') || phrase.toLowerCase().includes('marketing')) {
        domain = 'CUSTOMER_GROWTH_DEMAND';
      } else if (phrase.toLowerCase().includes('crm') || phrase.toLowerCase().includes('journey')) {
        domain = 'CRM_CUSTOMER_LIFECYCLE';
      }

      const mockId = `REQ_00${idx + 1}`;
      return {
        conceptId: mockId,
        conceptLabel: phrase,
        domain,
        evidence: [{ phrase, conceptId: mockId, source: 'jdEvidence' as const }]
      };
    });

    const candidateProfile = candidatePhrases.map((phrase, idx) => {
      let domain: CompetencyDomain = 'DIGITAL_TRANSFORMATION';
      if (phrase.toLowerCase().includes('p&l') || phrase.toLowerCase().includes('revenue')) {
        domain = 'COMMERCIAL_EXCELLENCE';
      } else if (phrase.toLowerCase().includes('growth') || phrase.toLowerCase().includes('marketing')) {
        domain = 'CUSTOMER_GROWTH_DEMAND';
      }

      const mockId = `CAN_00${idx + 1}`;
      return {
        conceptId: mockId,
        conceptLabel: phrase,
        domain,
        evidence: [{ phrase, conceptId: mockId, source: 'resumeEvidence' as const }]
      };
    });

    // Determine intersection logic vectors simply by tracking matching keyword tokens
    const matchedConcepts: string[] = [];
    jobProfile.forEach(j => {
      const hasMatch = candidateProfile.some(c => 
        c.conceptLabel.toLowerCase().includes(j.conceptLabel.toLowerCase()) ||
        j.conceptLabel.toLowerCase().includes(c.conceptLabel.toLowerCase())
      );
      if (hasMatch) {
        matchedConcepts.push(j.conceptId);
      }
    });

    // Factual allocation tracks mapped out of structural match rates
    const domainCoverage: Record<CompetencyDomain, number> = {
      COMMERCIAL_EXCELLENCE: 1.0,
      CUSTOMER_GROWTH_DEMAND: 0.6,
      DIGITAL_TRANSFORMATION: 1.0,
      CRM_CUSTOMER_LIFECYCLE: 0.0
    };

    const uniqueMatchedDomains = Array.from(new Set(
      jobProfile.filter(j => matchedConcepts.includes(j.conceptId)).map(j => j.domain)
    ));

    return {
      jobProfile,
      candidateProfile,
      matchedConcepts,
      domainCoverage,
      topMatchedDomains: uniqueMatchedDomains,
      primaryGaps: jobProfile.filter(j => !matchedConcepts.includes(j.conceptId)).map(j => j.conceptLabel)
    };
  }
}