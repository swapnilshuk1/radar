// lib/ranking/ConfigValidator.ts
// Startup configuration validation. Validates agg.json ranking_engine config.
// Fail-fast: throws descriptive errors on invalid config rather than silently degrading.

import { RankingEngineConfig } from './config';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class ConfigValidator {
  /**
   * Validate the RankingEngineConfig block from agg.json.
   * Throws on any hard error. Returns warnings for soft issues.
   */
  static validate(config: RankingEngineConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Required top-level keys
    const requiredKeys: (keyof RankingEngineConfig)[] = [
      'dimensions', 'title_fit', 'functional_fit', 'seniority_fit',
      'exec_signals', 'industry_fit', 'company_tiers', 'location_pref',
      'hard_filters', 'priority_thresholds'
    ];
    for (const key of requiredKeys) {
      if (!config[key]) {
        errors.push(`Missing required config key: ranking_engine.${key}`);
      }
    }

    // 2. Weight totals — weights can sum up to 100 or 1.0. If sum > 1.5, we assume percentage scale (max 100).
    if (config.dimensions) {
      const total = Object.values(config.dimensions).reduce((sum, d) => sum + (d.weight ?? 0), 0);
      if (total > 1.5) {
        if (total > 100.0 + 1e-9) {
          errors.push(`Dimension weights sum to ${total.toFixed(3)} — must not exceed 100`);
        } else if (total < 95.0) {
          warnings.push(`Dimension weights sum to ${total.toFixed(3)} — coverage below 95%, scores may be under-calibrated`);
        }
      } else {
        if (total > 1.0 + 1e-9) {
          errors.push(`Dimension weights sum to ${total.toFixed(3)} — must not exceed 1.0`);
        } else if (total < 0.95) {
          warnings.push(`Dimension weights sum to ${total.toFixed(3)} — coverage below 95%, scores may be under-calibrated`);
        }
      }
    }

    // 3. Priority threshold ordering: must_review > strong_match > worth_reviewing > possible_match
    if (config.priority_thresholds) {
      const t = config.priority_thresholds;
      if (t.must_review <= t.strong_match) {
        errors.push(`priority_thresholds.must_review (${t.must_review}) must be > strong_match (${t.strong_match})`);
      }
      if (t.strong_match <= t.worth_reviewing) {
        errors.push(`priority_thresholds.strong_match (${t.strong_match}) must be > worth_reviewing (${t.worth_reviewing})`);
      }
      if (t.worth_reviewing <= t.possible_match) {
        errors.push(`priority_thresholds.worth_reviewing (${t.worth_reviewing}) must be > possible_match (${t.possible_match})`);
      }
      // Invalid threshold range
      const allThresholds = [t.must_review, t.strong_match, t.worth_reviewing, t.possible_match];
      for (const val of allThresholds) {
        if (val < 0 || val > 100) {
          errors.push(`priority_thresholds value ${val} out of range [0, 100]`);
        }
      }
    }

    // 4. Duplicate skills in functional_fit.strong[]
    if (config.functional_fit?.strong) {
      const seen = new Set<string>();
      for (const skill of config.functional_fit.strong) {
        const key = skill.toLowerCase().trim();
        if (seen.has(key)) {
          errors.push(`Duplicate skill in functional_fit.strong: "${skill}"`);
        }
        seen.add(key);
      }
    }

    // 5. Non-empty taxonomy arrays
    if (config.exec_signals && config.exec_signals.length === 0) {
      errors.push('exec_signals must not be empty — no executive signals to match');
    }
    if (config.industry_fit && config.industry_fit.length === 0) {
      errors.push('industry_fit must not be empty — no industries to match');
    }
    if (config.hard_filters?.exclude_titles?.length === 0) {
      warnings.push('hard_filters.exclude_titles is empty — all titles will pass the hard filter');
    }
    if (config.location_pref && config.location_pref.length === 0) {
      warnings.push('location_pref is empty — location scoring will default to zero for all jobs');
    }

    // 6. Semantic enrichment threshold sanity
    if (config.semantic_enrichment) {
      const { minimum_rule_score } = config.semantic_enrichment;
      if (minimum_rule_score !== undefined && (minimum_rule_score < 0 || minimum_rule_score > 100)) {
        errors.push(`semantic_enrichment.minimum_rule_score (${minimum_rule_score}) must be in [0, 100]`);
      }
    }

    if (errors.length > 0) {
      const msg = [
        '[ConfigValidator] FATAL: agg.json configuration is invalid. Startup aborted.',
        ...errors.map(e => `  ✗ ${e}`),
        ...warnings.map(w => `  ⚠ ${w}`)
      ].join('\n');
      throw new Error(msg);
    }

    if (warnings.length > 0) {
      console.warn('[ConfigValidator] Warnings in agg.json:');
      warnings.forEach(w => console.warn(`  ⚠ ${w}`));
    }

    return { valid: true, errors: [], warnings };
  }
}
