import { NextRequest, NextResponse } from 'next/server';

if (typeof global !== 'undefined') {
  if (!(global as any).DOMMatrix) (global as any).DOMMatrix = class DOMMatrix {};
  if (!(global as any).ImageData) (global as any).ImageData = class ImageData {};
  if (!(global as any).Path2D) (global as any).Path2D = class Path2D {};
}

const pdf = require('pdf-parse');
import { ResumeAST, ExperienceItem, EducationItem } from '@/lib/ranking/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Extract raw text from PDF
    const parsedPdf = await pdf(buffer);
    const rawText = parsedPdf.text;

    // 2. Deterministic AST parsing
    const lines = rawText.split('\n').map((l: string) => l.trim()).filter(Boolean);

    const skills: string[] = [];
    const achievements: string[] = [];
    const leadershipSignals: string[] = [];
    const education: EducationItem[] = [];
    const experience: ExperienceItem[] = [];

    // Core taxons to scan
    const skillTaxonomy = [
      "salesforce", "cdp", "crm", "martech", "digital", "transformation", 
      "ecommerce", "commerce", "brand", "growth", "sales", "strategy", "gtm",
      "pmo", "performance", "acquisition", "roas", "attribution", "advertising"
    ];

    const degreeKeywords = ["b.tech", "b.e", "m.tech", "mba", "b.sc", "m.sc", "bachelor", "master", "ph.d"];

    for (const line of lines) {
      const lower = line.toLowerCase();

      // Extract skills
      for (const skill of skillTaxonomy) {
        if (lower.includes(skill) && !skills.includes(skill)) {
          skills.push(skill);
        }
      }

      // Extract achievements (metrics, action verbs, currency)
      if (
        /\b(?:managed|led|directed|architected|grew|scaled|increased|reduced|saved)\b/i.test(line) &&
        /(?:\d+%|\$\d+|₹\d+|\bcr\b|\bcrore\b|\bmillion\b)/i.test(line)
      ) {
        achievements.push(line);
      }

      // Extract leadership signals
      if (/\b(?:p&l|profit and loss|board|governance|direct reports|team size)\b/i.test(line)) {
        leadershipSignals.push(line);
      }

      // Extract education
      for (const degree of degreeKeywords) {
        if (lower.includes(degree)) {
          education.push({
            degree: degree.toUpperCase(),
            institution: line.slice(0, 80),
            year: /\b(19|20)\d{2}\b/.exec(line)?.[0] || "Unknown"
          });
          break;
        }
      }
    }

    const ast: ResumeAST = {
      experience, // In a full implementation, parses section blocks
      education,
      skills,
      achievements: achievements.slice(0, 8),
      leadershipSignals: leadershipSignals.slice(0, 5),
      certifications: []
    };

    return NextResponse.json({
      success: true,
      filename: file.name,
      length: rawText.length,
      ast
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
