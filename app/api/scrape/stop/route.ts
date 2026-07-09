import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  (global as any).shouldStopScraper = true;
  return NextResponse.json({ message: 'Scraper stop signal sent.' });
}
