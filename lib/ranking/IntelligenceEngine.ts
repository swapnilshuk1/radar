// lib/ranking/IntelligenceEngine.ts
// Orchestrator for compiling briefings. Statically registers and runs all active intelligence plugins.

import { BriefingBundle, EvaluationContext, FitVector } from './types';
import { BriefingRegistry } from './BriefingRegistry';

// Import Briefing Plugins
import { CompanyBriefingPlugin } from './briefings/CompanyBriefingPlugin';
import { ResumeBriefingPlugin } from './briefings/ResumeBriefingPlugin';
import { InterviewBriefingPlugin } from './briefings/InterviewBriefingPlugin';
import { CompensationBriefingPlugin } from './briefings/CompensationBriefingPlugin';

// Statically register briefing plugins
BriefingRegistry.clear();
BriefingRegistry.register(new CompanyBriefingPlugin());
BriefingRegistry.register(new ResumeBriefingPlugin());
BriefingRegistry.register(new InterviewBriefingPlugin());
BriefingRegistry.register(new CompensationBriefingPlugin());

export class IntelligenceEngine {
  /**
   * Compiles the complete BriefingBundle based on current evaluation state.
   */
  public static getBriefings(context: EvaluationContext, fitVector: FitVector): BriefingBundle {
    return BriefingRegistry.executeAll(context, fitVector);
  }
}
