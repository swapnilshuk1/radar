// app/api/weights/route.ts
// GET  — read current dimension weights from agg.json
// POST — validate and persist new dimension weights, clear config cache

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getConfig, clearConfigCache } from '@/lib/ranking/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = getConfig();
    const re = config.ranking_engine;
    return NextResponse.json({
      dimensions: re.dimensions,
      version: re.version,
      config_version: re.config_version,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { dimensions } = body as { dimensions: Record<string, { weight: number }> };

    if (!dimensions || typeof dimensions !== 'object') {
      return NextResponse.json({ error: 'dimensions object is required.' }, { status: 400 });
    }

    // Validate: all weights must be non-negative numbers
    for (const [key, def] of Object.entries(dimensions)) {
      if (typeof def.weight !== 'number' || def.weight < 0) {
        return NextResponse.json(
          { error: `Invalid weight for "${key}": must be a non-negative number.` },
          { status: 400 }
        );
      }
    }

    // Validate: weights must sum to 100 (allow ±0.5 rounding tolerance)
    const total = Object.values(dimensions).reduce((s, d) => s + d.weight, 0);
    if (Math.abs(total - 100) > 0.5) {
      return NextResponse.json(
        { error: `Weights must sum to 100. Current total: ${total.toFixed(1)}` },
        { status: 400 }
      );
    }

    // Write back to agg.json
    const configPath = path.join(process.cwd(), 'agg.json');
    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ error: 'agg.json not found at project root.' }, { status: 500 });
    }

    const raw = fs.readFileSync(configPath, 'utf-8');
    const fullConfig = JSON.parse(raw);
    fullConfig.ranking_engine.dimensions = dimensions;
    fs.writeFileSync(configPath, JSON.stringify(fullConfig, null, 2), 'utf-8');

    // Invalidate in-memory config cache so next evaluation picks up new weights
    clearConfigCache();

    return NextResponse.json({ success: true, dimensions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
