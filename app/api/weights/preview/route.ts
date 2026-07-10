// app/api/weights/preview/route.ts
// POST — applies a set of proposed weights to stored job fitVectors and returns
// before/after score comparisons. Reads are from DB, computation is pure math.
// Nothing is written to disk or DB — purely for live preview.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Mirrors RankingService.DIMENSION_KEY_MAP — maps evaluator dimensionName → agg.json config key
const DIMENSION_KEY_MAP: Record<string, string> = {
  titleFit:             'title_fit',
  leadershipFit:        'seniority_fit',
  functionalFit:        'functional_fit',
  careerProgressionFit: 'exec_signals',
  industryFit:          'industry_fit',
  companyHealth:        'company_quality',
  locationFit:          'location_pref',
  semanticSimilarity:   'semantic_similarity',
  hardRequirementFit:   'hard_requirement_fit',
};

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobIds, weights } = body as {
      jobIds: string[];
      weights: Record<string, { weight: number }>;
    };

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json({ error: 'jobIds array is required.' }, { status: 400 });
    }

    const jobs = await prisma.discoveredJob.findMany({
      where: { id: { in: jobIds } },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        matchScore: true,
        rankingData: true,
      },
    });

    const totalNewWeight = Object.values(weights).reduce((s, d) => s + d.weight, 0);

    const previews = jobs.map((job) => {
      const base = {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        oldScore: job.matchScore,
        newScore: job.matchScore,
        delta: 0,
        dimensions: [] as { label: string; configKey: string; rawScore: number; oldWeighted: number; newWeighted: number }[],
      };

      if (!job.rankingData) return base;

      let fitVector: Record<string, { score: number }> | null = null;
      let breakdown: { name: string; weight: number; rawScore: number }[] | null = null;

      try {
        const parsed = JSON.parse(job.rankingData);
        fitVector = parsed.evalResult?.fitVector ?? null;
        breakdown = parsed.breakdown ?? null;
      } catch {
        return base;
      }

      if (!fitVector || totalNewWeight === 0) return base;

      // Compute new weighted score using proposed weights
      let weightedSum = 0;
      let usedWeight = 0;
      const dimensions: typeof base.dimensions = [];

      for (const [dimName, dimData] of Object.entries(fitVector)) {
        const configKey = DIMENSION_KEY_MAP[dimName] ?? dimName;
        const oldWeight = weights[configKey]?.weight ?? 0; // for display
        const newWeight = weights[configKey]?.weight ?? 0;

        weightedSum += dimData.score * newWeight;
        usedWeight += newWeight;

        // Find the original weight from the breakdown
        const bItem = breakdown?.find(b => {
          // breakdown names are display labels; map back through the key map
          return Object.entries(DIMENSION_KEY_MAP).some(
            ([ek, ck]) => ck === configKey && b.name.toLowerCase().includes(ek.substring(0, 5).toLowerCase())
          );
        });
        const originalWeight = bItem?.weight ?? oldWeight;

        dimensions.push({
          label: dimName,
          configKey,
          rawScore: dimData.score / 100,
          oldWeighted: Math.round((dimData.score / 100) * originalWeight * 10) / 10,
          newWeighted: Math.round((dimData.score / 100) * newWeight * 10) / 10,
        });
      }

      const newScore = usedWeight > 0 ? Math.round(weightedSum / usedWeight) : 0;

      return {
        ...base,
        newScore,
        delta: newScore - job.matchScore,
        dimensions,
      };
    });

    return NextResponse.json({ previews });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
