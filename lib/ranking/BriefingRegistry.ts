// lib/ranking/BriefingRegistry.ts
// Registry for mapping and running briefing plugins dynamically.

import { BriefingPlugin, BriefingBundle, EvaluationContext, FitVector } from './types';

export class BriefingRegistry {
  private static plugins = new Map<string, BriefingPlugin>();

  public static register(plugin: BriefingPlugin): void {
    this.plugins.set(plugin.pluginKey, plugin);
  }

  public static get(key: string): BriefingPlugin | undefined {
    return this.plugins.get(key);
  }

  public static executeAll(context: EvaluationContext, fitVector: FitVector): BriefingBundle {
    const bundle: BriefingBundle = {};
    for (const [key, plugin] of this.plugins.entries()) {
      try {
        bundle[key] = plugin.build(context, fitVector);
      } catch (err) {
        bundle[key] = {
          title: plugin.title,
          status: "locked",
          confidence: "LOW",
          trustBasis: "Evaluation failed to execute.",
          sources: [],
          sections: [
            {
              id: "failed_execution",
              title: "Error",
              type: "narrative",
              content: `Failed to compile brief: ${err instanceof Error ? err.message : String(err)}`
            }
          ],
          lastEvaluated: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 60000).toISOString()
        };
      }
    }
    return bundle;
  }

  public static clear(): void {
    this.plugins.clear();
  }
}
