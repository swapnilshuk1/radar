// scripts/rescore-all-jobs.ts
// One-shot backfill: re-evaluates every stored job using the corrected
// RankingService (config-driven weights via agg.json) and writes results back.
//
// Run: npx tsx scripts/rescore-all-jobs.ts

import { PrismaClient } from '@prisma/client';
import { RankingEngine } from '../lib/ranking/RankingService';

const prisma = new PrismaClient();

async function main() {
  const jobs = await prisma.discoveredJob.findMany({
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      snippet: true,
      semanticData: true,
      matchScore: true,
      status: true,
    }
  });

  console.log(`\n🔄  Rescoring ${jobs.length} jobs with corrected weight engine...\n`);

  let updated = 0;
  let skipped = 0;
  let failed  = 0;

  for (const job of jobs) {
    try {
      const result = RankingEngine.evaluate(
        {
          title: job.title,
          snippet: job.snippet || '',
          location: job.location || '',
          company: job.company,
          semanticData: job.semanticData ?? null,
        },
        undefined
      );

      if (result.rejected) {
        console.log(`  ⛔  Rejected: "${job.title}" — ${result.rejectReason}`);
        skipped++;
        continue;
      }

      const explanation = result.explanation!;
      const newScore    = explanation.matchScore;
      const oldScore    = job.matchScore;

      await prisma.discoveredJob.update({
        where: { id: job.id },
        data: {
          matchScore:           newScore,
          rankingData:          JSON.stringify(explanation),
          rankingVersion:       explanation.version,
          rankingConfigVersion: explanation.configVersion,
          jobHash:              explanation.jobHash ?? null,
        }
      });

      const delta = newScore - oldScore;
      const sign  = delta >= 0 ? '+' : '';
      console.log(`  ✅  "${job.title.slice(0, 55)}" — ${oldScore} → ${newScore} (${sign}${delta})`);
      updated++;
    } catch (err: any) {
      console.error(`  ❌  Error rescoring "${job.title}": ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊  Done. Updated: ${updated}  |  Skipped: ${skipped}  |  Failed: ${failed}\n`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
