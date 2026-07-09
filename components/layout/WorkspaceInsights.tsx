"use client";

import { Job } from "../jobs/JobList";
import {
  BarChart3,
  Globe,
  Briefcase,
  MapPin,
  TrendingUp,
  Layers,
  CheckCircle2,
  Clock,
  Terminal,
} from "lucide-react";
import type { PriorityTier } from "../../lib/ranking/types";

interface WorkspaceInsightsProps {
  jobs: Job[];
  logs: string[];
}

const PRIORITY_ORDER: PriorityTier[] = [
  "Must Review",
  "Strong Match",
  "Worth Reviewing",
  "Possible Match",
  "Low Priority",
];

const PRIORITY_COLOR: Record<PriorityTier, string> = {
  "Must Review":     "bg-emerald-500",
  "Strong Match":    "bg-blue-500",
  "Worth Reviewing": "bg-amber-400",
  "Possible Match":  "bg-slate-300",
  "Low Priority":    "bg-slate-200",
};

const PRIORITY_TEXT: Record<PriorityTier, string> = {
  "Must Review":     "text-emerald-700",
  "Strong Match":    "text-blue-700",
  "Worth Reviewing": "text-amber-700",
  "Possible Match":  "text-slate-500",
  "Low Priority":    "text-slate-400",
};

export function WorkspaceInsights({ jobs, logs }: WorkspaceInsightsProps) {
  // Derive all metrics from jobs array
  const total = jobs.length;
  const newCount = jobs.filter(j => j.status === "New").length;
  const savedCount = jobs.filter(j => j.status === "Reviewed").length;
  const archivedCount = jobs.filter(j => j.status === "Archived").length;

  // Priority distribution from rankingData
  const priorityCounts: Record<string, number> = {};
  let unranked = 0;
  for (const job of jobs) {
    if (job.rankingData) {
      try {
        const exp = JSON.parse(job.rankingData);
        const p: string = exp.priority ?? "Unranked";
        priorityCounts[p] = (priorityCounts[p] ?? 0) + 1;
      } catch { unranked++; }
    } else {
      unranked++;
    }
  }
  const maxPriorityCount = Math.max(...Object.values(priorityCounts), 1);

  // Source distribution
  const sourceCounts: Record<string, number> = {};
  for (const job of jobs) {
    sourceCounts[job.sourcePortal] = (sourceCounts[job.sourcePortal] ?? 0) + 1;
  }

  // Score stats (exclude 0 and negatives from old engine)
  const validScores = jobs.map(j => j.matchScore).filter(s => s > 0);
  const avgScore = validScores.length > 0
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : 0;
  const maxScore = validScores.length > 0 ? Math.max(...validScores) : 0;

  // Last 5 engine log lines
  const recentLogs = logs.slice(-5).reverse();

  const SOURCE_ICON: Record<string, typeof Globe> = {
    LinkedIn: Globe,
    Naukri: Briefcase,
    Indeed: MapPin,
  };

  return (
    <div className="p-5 space-y-6 font-sans text-slate-800">

      {/* Feed Overview */}
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
          Feed Overview
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Total",    value: total,          icon: Layers,        color: "text-slate-700" },
            { label: "New",      value: newCount,        icon: TrendingUp,    color: "text-blue-600"  },
            { label: "Saved",    value: savedCount,      icon: CheckCircle2,  color: "text-emerald-600"},
            { label: "Archived", value: archivedCount,   icon: Clock,         color: "text-slate-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-slate-50 rounded-lg p-3 flex items-center gap-2.5 border border-slate-100">
              <Icon className={`w-4 h-4 shrink-0 ${color}`} />
              <div>
                <p className={`text-lg font-black leading-none ${color}`}>{value}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score Stats */}
      {validScores.length > 0 && (
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
            Score Statistics
          </h3>
          <div className="flex gap-3">
            <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-center">
              <p className="text-2xl font-black text-emerald-700">{maxScore}</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Top Score</p>
            </div>
            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
              <p className="text-2xl font-black text-slate-700">{avgScore}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Average</p>
            </div>
            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
              <p className="text-2xl font-black text-slate-700">{validScores.length}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Ranked</p>
            </div>
          </div>
        </div>
      )}

      {/* Priority Distribution */}
      {Object.keys(priorityCounts).length > 0 && (
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
            <BarChart3 className="w-3 h-3" /> Priority Distribution
          </h3>
          <div className="space-y-2">
            {PRIORITY_ORDER.filter(p => (priorityCounts[p] ?? 0) > 0).map(priority => {
              const count = priorityCounts[priority] ?? 0;
              const pct = Math.round((count / maxPriorityCount) * 100);
              return (
                <div key={priority} className="space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className={`text-[11px] font-bold ${PRIORITY_TEXT[priority]}`}>{priority}</span>
                    <span className="text-[11px] font-mono text-slate-400">{count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${PRIORITY_COLOR[priority]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {unranked > 0 && (
              <p className="text-[10px] text-slate-300 font-medium pt-1">{unranked} jobs need re-scoring</p>
            )}
          </div>
        </div>
      )}

      {/* Source Distribution */}
      {Object.keys(sourceCounts).length > 0 && (
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
            Sources
          </h3>
          <div className="space-y-1.5">
            {Object.entries(sourceCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([source, count]) => {
                const Icon = SOURCE_ICON[source] ?? Globe;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={source} className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="font-semibold text-slate-600">{source}</span>
                        <span className="text-slate-400 font-mono">{count}</span>
                      </div>
                      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-300 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Engine Activity */}
      {recentLogs.length > 0 && (
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            <Terminal className="w-3 h-3" /> Recent Activity
          </h3>
          <div className="space-y-1 bg-slate-950 rounded-lg p-3">
            {recentLogs.map((log, i) => (
              <p key={i} className={`text-[10px] font-mono leading-relaxed ${
                i === 0 ? 'text-slate-200' : 'text-slate-500'
              }`}>
                {log.replace(/^\[.*?\]\s*/, '')}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {total === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="w-8 h-8 text-slate-200 mb-3" />
          <p className="text-[11px] text-slate-400 font-semibold">No feed data yet</p>
          <p className="text-[10px] text-slate-300 mt-1">Run a search to populate workspace insights.</p>
        </div>
      )}

    </div>
  );
}
