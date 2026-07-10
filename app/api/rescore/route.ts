// app/api/rescore/route.ts
// Re-scores all existing jobs using the new decoupled CandidateMatchingService and RankingEngine v2.1.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { RankingEngine } from '@/lib/ranking/RankingService';
import { OpportunityEnrichmentService } from '@/lib/ranking/OpportunityEnrichmentService';
import { getConfig, getCandidateProfile } from '@/lib/ranking/config';
import { SemanticData } from '@/lib/ranking/types';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const jobs = await prisma.discoveredJob.findMany();
    const config = getConfig();
    const seConfig = config.ranking_engine.semantic_enrichment;
    const profile = getCandidateProfile();
    const currentResumeVersion = profile.resume?.sourceResumeVersion || "2026-07-09";

    let updated = 0;
    let enriched = 0;
    let rejected = 0;
    let errored = 0;

    for (const job of jobs) {
      try {
        // Step 1: Run deterministic rules-only evaluation first
        const ruleScore = RankingEngine.evaluateRulesOnly({
          title: job.title,
          snippet: job.snippet || '',
          location: job.location,
          company: job.company
        }, profile);

        if (ruleScore === 0) {
          // Excluded by hard filters
          await prisma.discoveredJob.update({
            where: { id: job.id },
            data: {
              matchScore: 0,
              rankingData: JSON.stringify({ version: 'v2.1', rejected: true, rejectReason: 'Exclusions matched' }),
              rankingVersion: 'v2.1'
            }
          });
          rejected++;
          continue;
        }

        // Check if we already have a valid cached semantic enrichment
        let semanticDataPayload: SemanticData | null = null;
        let needsEnrichment = false;

        if (job.semanticData) {
          try {
            const parsed = JSON.parse(job.semanticData) as SemanticData;
            if (parsed.sourceResumeVersion !== currentResumeVersion || parsed.semanticVersion !== '1.0') {
              needsEnrichment = true; // Stale resume or prompt version
            } else {
              semanticDataPayload = parsed;
            }
          } catch {
            needsEnrichment = true;
          }
        } else {
          needsEnrichment = true;
        }

        // Step 2: Trigger Gemini enrichment only if base score matches gating threshold
        let semanticDataJson: string | null = job.semanticData;

        if (needsEnrichment && seConfig && seConfig.enabled && ruleScore >= seConfig.minimum_rule_score) {
          try {
            const enrichedData = await OpportunityEnrichmentService.enrich({
              title: job.title,
              snippet: job.snippet || '',
              location: job.location,
              company: job.company
            }, profile);

            semanticDataPayload = enrichedData;
            semanticDataJson = JSON.stringify(enrichedData);
            enriched++;
          } catch (enrichErr: any) {
            console.error(`Rescore enrichment failed for ${job.title}: ${enrichErr.message}`);
          }
        }

        // If it doesn't qualify for enrichment, keep semanticDataPayload = null (giving semanticScore = 0)

        // Step 3: Run final deterministic evaluation combining rules & semantic cache
        const finalResult = RankingEngine.evaluate({
          title: job.title,
          snippet: job.snippet || '',
          location: job.location,
          company: job.company,
          semanticData: semanticDataJson
        }, profile);

        if (finalResult.rejected) {
          await prisma.discoveredJob.update({
            where: { id: job.id },
            data: {
              matchScore: 0,
              rankingData: JSON.stringify({ version: 'v2.1', rejected: true, rejectReason: finalResult.rejectReason }),
              rankingVersion: 'v2.1'
            }
          });
          rejected++;
        } else {
          const exp = finalResult.explanation!;

          // Merge hardMismatches back to DB cache if newly fetched
          const hardMismatches = finalResult.explanation?.evalResult?.fitVector?.hardRequirementFit?.metadata?.hardMismatches;
          if (hardMismatches && Array.isArray(hardMismatches)) {
            const parsed = semanticDataJson ? JSON.parse(semanticDataJson) : {};
            parsed.hardMismatches = hardMismatches;
            semanticDataJson = JSON.stringify(parsed);
          }

          await prisma.discoveredJob.update({
            where: { id: job.id },
            data: {
              matchScore: exp.matchScore,
              rankingData: JSON.stringify(exp),
              rankingVersion: exp.version,
              rankingConfigVersion: exp.configVersion,
              semanticData: semanticDataJson
            }
          });
          updated++;
        }
      } catch (rowErr: any) {
        errored++;
        console.error(`Rescore error for job ${job.id}: ${rowErr.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      total: jobs.length,
      updated,
      enriched,
      rejected,
      errored
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
