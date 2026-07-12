// lib/ranking/ontology/PhraseNormalizer.ts
import { STOP_WORDS, STEM_RULES } from './data';

export class PhraseNormalizer {
  /**
   * Transforms raw text expressions into clean, stemmed token arrays.
   * Internal implementation detail hidden from the public matching API layers.
   */
  public static tokenizeAndNormalize(text: string): Set<string> {
    const rawTokens = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2);

    const processedTokens = new Set<string>();

    for (const token of rawTokens) {
      if (STOP_WORDS.has(token)) continue;
      
      // Enforce strict matching from explicit maps rather than generic trailing character slices
      if (STEM_RULES[token]) {
        processedTokens.add(STEM_RULES[token]);
      } else {
        processedTokens.add(token);
      }
    }

    return processedTokens;
  }
}