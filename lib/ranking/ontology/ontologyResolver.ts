// lib/ranking/ontology/OntologyResolver.ts
import { getStructuredOntologyRegistry } from './data';
import { PhraseNormalizer } from './PhraseNormalizer';
import { ResolvedCapability, ExtractionSource, MatchEvidence } from './types';

export class OntologyResolver {
  private static evaluateCoverage(inputPhrase: string, ontologyTerm: string): boolean {
    const inputTokens = PhraseNormalizer.tokenizeAndNormalize(inputPhrase);
    const ontologyTokens = PhraseNormalizer.tokenizeAndNormalize(ontologyTerm);

    if (ontologyTokens.size === 0 || inputTokens.size === 0) return false;

    let matchingTokens = 0;
    ontologyTokens.forEach(token => {
      if (inputTokens.has(token)) matchingTokens++;
    });

    return matchingTokens === ontologyTokens.size || (ontologyTokens.size > 2 && (matchingTokens / ontologyTokens.size) >= 0.75);
  }

  public static resolveProfileTerms(rawPhrases: string[], allowedSources: ExtractionSource[]): ResolvedCapability[] {
    const capabilityMap = new Map<string, ResolvedCapability>();
    const activeRegistry = getStructuredOntologyRegistry();

    for (const phrase of rawPhrases) {
      if (!phrase || phrase.trim().length < 3) continue;

      for (const struct of activeRegistry) {
        for (const concept of struct.concepts) {
          
          const checkFields: { field: ExtractionSource | 'label'; items: string[] }[] = [
            { field: 'label', items: [concept.label] },
            { field: 'aliases', items: [...concept.aliases] },
            { field: 'resumeEvidence', items: [...concept.resumeEvidence] },
            { field: 'jdEvidence', items: [...concept.jdEvidence] }
          ];

          for (const target of checkFields) {
            if (target.field !== 'label' && !allowedSources.includes(target.field as ExtractionSource)) continue;

            for (const item of target.items) {
              if (this.evaluateCoverage(phrase, item)) {
                const mapKey = `${struct.domain}:${concept.id}`;
                const sourceTag = target.field === 'label' ? 'label' : (target.field as ExtractionSource);

                const evidenceItem: MatchEvidence = {
                  phrase,
                  conceptId: concept.id,
                  source: sourceTag
                };

                if (!capabilityMap.has(mapKey)) {
                  capabilityMap.set(mapKey, {
                    domain: struct.domain,
                    conceptId: concept.id,
                    conceptLabel: concept.label,
                    evidence: [evidenceItem]
                  });
                } else {
                  capabilityMap.get(mapKey)!.evidence.push(evidenceItem);
                }
              }
            }
          }
        }
      }
    }
    return Array.from(capabilityMap.values());
  }

  public static resolveResume(phrases: string[]): ResolvedCapability[] {
    return this.resolveProfileTerms(phrases, ['aliases', 'resumeEvidence']);
  }

  public static resolveJD(phrases: string[]): ResolvedCapability[] {
    return this.resolveProfileTerms(phrases, ['aliases', 'jdEvidence']);
  }
}