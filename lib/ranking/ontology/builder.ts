// lib/ranking/ontology/builder.ts
import { ConceptDefinition, CompetencyStructure } from './types';

export function concept(props: Omit<ConceptDefinition, 'weight'> & { weight?: number }): ConceptDefinition {
  return {
    id: props.id,
    label: props.label,
    weight: props.weight ?? 1.0, 
    aliases: props.aliases || [],
    resumeEvidence: props.resumeEvidence || [],
    jdEvidence: props.jdEvidence || []
  };
}

export function validateOntology(registry: CompetencyStructure[]): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();
  const seenLabels = new Set<string>();
  
  // Track alias to concept ID occurrences to catch structural ambiguities
  const aliasConceptMap = new Map<string, string[]>();

  for (const struct of registry) {
    for (const c of struct.concepts) {
      if (seenIds.has(c.id)) errors.push(`Duplicate Concept ID detected: ${c.id}`);
      seenIds.add(c.id);

      if (seenLabels.has(c.label.toLowerCase())) errors.push(`Duplicate Concept Label detected: ${c.label}`);
      seenLabels.add(c.label.toLowerCase());

      const allTerms = [...c.aliases, ...c.resumeEvidence, ...c.jdEvidence];
      for (const term of allTerms) {
        const normalized = term.toLowerCase().trim();
        if (!aliasConceptMap.has(normalized)) {
          aliasConceptMap.set(normalized, []);
        }
        aliasConceptMap.get(normalized)!.push(c.id);
      }
    }
  }

  // Evaluate alias mapping overlaps to flag potential ambiguity risks
  aliasConceptMap.forEach((conceptIds, term) => {
    const uniqueIds = Array.from(new Set(conceptIds));
    if (uniqueIds.length > 1) {
      warnings.push(`Ambiguity Warning: Term "${term}" is mapped across multiple concepts: ${uniqueIds.join(', ')}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}