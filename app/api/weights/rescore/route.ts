// app/api/weights/rescore/route.ts
// POST — applies current agg.json weights to ALL stored jobs.
// Runs synchronously (135 jobs ~3-5s on local machine).
// Forward-only: only triggered explicitly. Does not touch semantic data.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { RankingEngine } from '@/lib/ranking/RankingService';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const jobs = await prisma.discoveredJob.findMany({
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        snippet: true,
        semanticData: true,
        matchScore: true,
      },
    });

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        const result = RankingEngine.evaluate({
          title: job.title,
          snippet: job.snippet || '',
          location: job.location || '',
          company: job.company,
          semanticData: job.semanticData ?? null,
        });

        if (result.rejected) {
          skipped++;
          continue;
        }

        const explanation = result.explanation!;

        await prisma.discoveredJob.update({
          where: { id: job.id },
          data: {
            matchScore: explanation.matchScore,
            rankingData: JSON.stringify(explanation),
            rankingVersion: explanation.version,
            rankingConfigVersion: explanation.configVersion,
            jobHash: explanation.jobHash ?? null,
          },
        });

        updated++;
      } catch {
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      total: jobs.length,
      updated,
      skipped,
      failed,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
