// lib/ranking/VersionManifest.ts
// Single source of truth for all RADAR decision-pipeline component versions.
// Bump the relevant version string whenever that component's logic changes.
// Every processed job persists this snapshot so historical recommendations are always reproducible.

export const VERSION_MANIFEST = {
  normalizer:    "1.2.0",  // Normalizer.ts entity extraction logic version
  skillGraph:    "1.0.0",  // Skill taxonomy / FunctionalFit evaluator version
  ruleEngine:    "3.3.0",  // DecisionEngine.ts rule matrix version
  promptVersion: "gemini-2.0-v1", // LLM prompt template version (OpportunityEnrichmentService)
  briefing:      "1.1.0",  // IntelligenceEngine / BriefingPlugin version
} as const;

export type VersionManifest = typeof VERSION_MANIFEST;
