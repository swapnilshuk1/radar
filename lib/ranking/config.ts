// lib/ranking/config.ts
// Loads and caches the agg.json configuration.
// Exposes both the full config and a CandidateProfile derived from it.

import fs from 'fs';
import path from 'path';
import { CandidateProfile } from './types';
import { ConfigValidator } from './ConfigValidator';

export interface RankingEngineConfig {
  version: string;
  config_version: string;
  semantic_enrichment: {
    enabled: boolean;
    minimum_rule_score: number;
    model: string;
    prompt_version: string;
  };
  dimensions: Record<string, { weight: number }>;
  title_fit: {
    strong_match: string[];
    partial_match: string[];
  };
  seniority_fit: {
    tiers: Array<{ terms: string[]; score: number }>;
  };
  functional_fit: {
    strong: string[];
    semantic_clusters: string[][];
  };
  exec_signals: string[];
  industry_fit: string[];
  company_tiers: {
    tier_1: string[];
    tier_2: string[];
    default_score: number;
  };
  location_pref: string[];
  remote_signals: string[];
  hard_filters: {
    exclude_titles: string[];
    exclude_content: string[];
  };
  priority_thresholds: {
    must_review: number;
    strong_match: number;
    worth_reviewing: number;
    possible_match: number;
  };
}

export interface FullConfig {
  search_parameters: {
    target_mandates: string[];
    locations: string[];
    experience_minimum_years: number;
  };
  filtering_rules: {
    executive_signals_must_have: string[];
    noise_filters_exclude: string[];
  };
  scoring_logic: {
    base_weight_title_match: number;
    weight_per_executive_signal: number;
    penalty_for_missing_location: number;
  };
  ranking_engine: RankingEngineConfig;
  portals: Record<string, { base_url: string; active: boolean }>;
}

let cachedConfig: FullConfig | null = null;
let cachedProfile: CandidateProfile | null = null;

const CONFIG_PATHS = [
  path.join(/* turbopackIgnore: true */ process.cwd(), 'agg.json'),
  path.join(/* turbopackIgnore: true */ process.cwd(), '..', 'agg.json'),
  'C:\\Users\\swapn\\Downloads\\Aggrigator\\agg.json'
];

export function getConfig(): FullConfig {
  if (cachedConfig) return cachedConfig;

  for (const configPath of CONFIG_PATHS) {
    try {
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf-8');
        cachedConfig = JSON.parse(raw) as FullConfig;
        return cachedConfig;
      }
    } catch {
      // Try next path
    }
  }

  throw new Error('Config file (agg.json) not found.');
}

export function getRankingConfig(): RankingEngineConfig {
  const cfg = getConfig().ranking_engine;
  ConfigValidator.validate(cfg); // Fail-fast validation on first call (cached config re-validates only once)
  return cfg;
}

/**
 * Load CandidateProfile from candidate_profile.json.
 */
export function getCandidateProfile(): CandidateProfile {
  if (cachedProfile) return cachedProfile;

  const profilePath = path.join(__dirname, 'candidate_profile.json');
  try {
    if (fs.existsSync(profilePath)) {
      const raw = fs.readFileSync(profilePath, 'utf-8');
      cachedProfile = JSON.parse(raw) as CandidateProfile;
      return cachedProfile;
    }
  } catch (err: any) {
    console.error('Error loading candidate_profile.json:', err.message);
  }

  // Fallback candidate profile if file load fails
  return {
    identity: {
      name: "Swapnil Shukla",
      currentTitle: "VP Marketing"
    },
    experience: {
      yearsExperience: 20,
      teamSizeManaged: 40,
      feeBookScale: "$8M",
      plOwnership: true,
      boardInteraction: true,
      achievements: ["Managed $8M fee book for Ford"]
    },
    preferences: {
      locations: ["Gurugram", "Delhi NCR", "Mumbai", "Bengaluru"],
      remote: "Hybrid",
      targetMinSalary: "₹1.5 Cr",
      industries: ["Automotive", "Healthcare", "Consumer"]
    },
    strategy: {
      targetTitles: ["Senior Vice President", "VP Marketing", "Chief Marketing Officer"],
      ceoPathway: true,
      boardReadiness: true
    },
    resume: {
      rawText: "Swapnil Shukla resume context",
      sourceResumeVersion: "3.1.2"
    },
    skills: ["Salesforce CDP", "CRM Migration"]
  };
}

/** Clear cached config (useful after config file changes) */
export function clearConfigCache(): void {
  cachedConfig = null;
}
