// app/api/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch data from Prisma first so 'jobs' is defined
    const jobs = await prisma.discoveredJob.findMany({
      orderBy: [
        { matchScore: 'desc' },
        { scrapedAt: 'desc' }
      ]
    });

    // 2. Isolate the target row safely inside scope
    const smokingGunJob = jobs.find(j => j.id === '002817cf-6663-40ea-8abd-28bc237c1763');

    if (smokingGunJob && smokingGunJob.rankingData) {
      try {
        const parsed = JSON.parse(smokingGunJob.rankingData);
        const targetBlock = parsed.evalResult ?? parsed ?? {};
        const functionalVector = targetBlock?.fitVector?.functionalFit ?? {};

        console.log("\n==================================================");
        console.log("COMPLETE RAW OBJECT DUMP FOR ID: 002817cf");
        console.log("==================================================");
        
        // This will securely print out every single available schema key mapping
        console.log("RAW FUNCTIONAL VECTOR OBJECT:", JSON.stringify(functionalVector, null, 2));
        
        console.log("==================================================\n");
      } catch (err) {
        console.log("Failed raw object dump pass:", err);
      }
    }

    return NextResponse.json(jobs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    if (status !== 'New' && status !== 'Reviewed' && status !== 'Archived') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updatedJob = await prisma.discoveredJob.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json(updatedJob);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}