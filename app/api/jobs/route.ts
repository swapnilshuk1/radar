import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const jobs = await prisma.discoveredJob.findMany({
      orderBy: [
        { matchScore: 'desc' },
        { scrapedAt: 'desc' }
      ]
    });
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
