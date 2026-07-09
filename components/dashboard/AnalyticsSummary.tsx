"use client";

import { Award, Layers, Sparkles, FolderOpen, Archive } from "lucide-react";

interface AnalyticsSummaryProps {
  totalCount: number;
  newCount: number;
  reviewedCount: number;
  archivedCount: number;
  maxScore: number;
}

export function AnalyticsSummary({
  totalCount,
  newCount,
  reviewedCount,
  archivedCount,
  maxScore,
}: AnalyticsSummaryProps) {
  const metrics = [
    { label: "Total feed", value: totalCount, icon: Layers, border: "border-slate-200" },
    { label: "Active new", value: newCount, icon: Sparkles, border: "border-slate-200" },
    { label: "Saved Listings", value: reviewedCount, icon: FolderOpen, border: "border-slate-200" },
    { label: "Archived", value: archivedCount, icon: Archive, border: "border-slate-200" },
    { label: "Highest match", value: `${maxScore} pts`, icon: Award, border: "border-slate-200", colSpan: true },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 font-sans">
      {metrics.map((m, i) => {
        const Icon = m.icon;
        return (
          <div
            key={i}
            className={`bg-white border border-slate-200 rounded-lg p-2.5 flex items-center gap-3 shadow-sm ${
              m.colSpan ? "col-span-2 sm:col-span-1" : ""
            }`}
          >
            <div className="p-1.5 rounded bg-slate-50 text-slate-500">
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                {m.label}
              </p>
              <p className="text-sm font-black text-slate-900 mt-1 font-mono leading-none">
                {m.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
