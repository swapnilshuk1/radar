'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sliders,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Info,
  RotateCcw,
  ArrowRight,
  Zap,
  Lock,
} from 'lucide-react';

// ─── Dimension metadata: labels, colors, descriptions ─────────────────────────
const DIMENSION_META: Record<
  string,
  { label: string; color: string; tailwindColor: string; description: string; emoji: string }
> = {
  title_fit: {
    label: 'Title & Role Match',
    color: '#3b82f6',
    tailwindColor: 'blue',
    description: 'Alignment of the job title with target mandates (CMO, SVP Marketing, Head of Digital…)',
    emoji: '🎯',
  },
  seniority_fit: {
    label: 'Seniority Level',
    color: '#8b5cf6',
    tailwindColor: 'violet',
    description: 'Whether the role seniority matches VP/C-suite expectations',
    emoji: '🏆',
  },
  functional_fit: {
    label: 'Functional Expertise',
    color: '#10b981',
    tailwindColor: 'emerald',
    description: 'Overlap with core skills: P&L, GTM, CRM, omnichannel, digital transformation',
    emoji: '⚡',
  },
  exec_signals: {
    label: 'Executive Signals',
    color: '#f59e0b',
    tailwindColor: 'amber',
    description: 'Board-level, C-suite, profit-centre, and business unit head signals in the JD',
    emoji: '📡',
  },
  industry_fit: {
    label: 'Industry Experience',
    color: '#6366f1',
    tailwindColor: 'indigo',
    description: 'Match against preferred sectors: Consumer, FMCG, Tech, Healthcare, Fintech',
    emoji: '🏭',
  },
  company_quality: {
    label: 'Company Tier',
    color: '#64748b',
    tailwindColor: 'slate',
    description: 'Tier 1/2 company recognition: Unilever, HUL, Google, Reliance, Razorpay…',
    emoji: '🏢',
  },
  location_pref: {
    label: 'Location Preference',
    color: '#f43f5e',
    tailwindColor: 'rose',
    description: 'Geographic match: Gurugram, Delhi NCR, Mumbai, Bengaluru, APAC',
    emoji: '📍',
  },
  semantic_similarity: {
    label: 'AI Semantic Match',
    color: '#a855f7',
    tailwindColor: 'purple',
    description: 'Deep context match via Gemini — only for qualifying jobs (rule score ≥ 40)',
    emoji: '🤖',
  },
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface WeightsDef {
  [key: string]: { weight: number };
}

interface PreviewJob {
  id: string;
  title: string;
  company: string;
  location: string;
  oldScore: number;
  newScore: number;
  delta: number;
}

// ─── Score colour helper ────────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 65) return 'text-blue-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-slate-500';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 65) return 'bg-blue-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-slate-600';
}

// ─── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debouncedValue;
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export function WeightsConfigurator() {
  const [savedWeights, setSavedWeights] = useState<WeightsDef>({});
  const [weights, setWeights] = useState<WeightsDef>({});
  const [previewJobIds, setPreviewJobIds] = useState<string[]>([]);
  const [previews, setPreviews] = useState<PreviewJob[]>([]);
  const [isLoadingWeights, setIsLoadingWeights] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRescoring, setIsRescoring] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [rescoreStatus, setRescoreStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showRescoreConfirm, setShowRescoreConfirm] = useState(false);
  const [tooltipDim, setTooltipDim] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const debouncedWeights = useDebounce(weights, 400);

  const total = Object.values(weights).reduce((s, d) => s + d.weight, 0);
  const isDirty = JSON.stringify(weights) !== JSON.stringify(savedWeights);
  const isValid = Math.abs(total - 100) <= 0.5;

  // ── Load weights + preview jobs ──────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        setIsLoadingWeights(true);
        const [wRes, jRes] = await Promise.all([
          fetch('/api/weights'),
          fetch('/api/jobs?limit=50&sort=score'),
        ]);

        if (wRes.ok) {
          const { dimensions } = await wRes.json();
          setWeights(dimensions);
          setSavedWeights(dimensions);
        }

        if (jRes.ok) {
          const data = await jRes.json();
          const jobs = data.jobs ?? data ?? [];
          // Pick 3 jobs: 1 high, 1 mid, 1 lower-scoring for meaningful preview
          const sorted = [...jobs].sort((a: any, b: any) => b.matchScore - a.matchScore);
          const picks: string[] = [];
          const high = sorted.find((j: any) => j.matchScore >= 65);
          const mid = sorted.find((j: any) => j.matchScore >= 45 && j.matchScore < 65);
          const low = sorted.find((j: any) => j.matchScore > 0 && j.matchScore < 45);
          if (high) picks.push(high.id);
          if (mid) picks.push(mid.id);
          if (low) picks.push(low.id);
          // pad with next best if needed
          for (const j of sorted) {
            if (picks.length >= 3) break;
            if (!picks.includes(j.id)) picks.push(j.id);
          }
          setPreviewJobIds(picks.slice(0, 3));
        }
      } finally {
        setIsLoadingWeights(false);
      }
    }
    load();
  }, []);

  // ── Fetch preview whenever debounced weights or jobs change ─────────────────
  useEffect(() => {
    if (previewJobIds.length === 0 || Object.keys(debouncedWeights).length === 0) return;
    async function fetchPreview() {
      setIsPreviewLoading(true);
      try {
        const res = await fetch('/api/weights/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobIds: previewJobIds, weights: debouncedWeights }),
        });
        if (res.ok) {
          const { previews: p } = await res.json();
          setPreviews(p);
        }
      } finally {
        setIsPreviewLoading(false);
      }
    }
    fetchPreview();
  }, [debouncedWeights, previewJobIds]);

  // ── Slider change ─────────────────────────────────────────────────────────────
  const handleSlider = (key: string, value: number) => {
    setWeights(prev => ({ ...prev, [key]: { weight: value } }));
    setSaveStatus(null);
  };

  // ── Reset to saved ────────────────────────────────────────────────────────────
  const handleReset = () => {
    setWeights(savedWeights);
    setSaveStatus(null);
  };

  // ── Save weights ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!isValid || isSaving) return;
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch('/api/weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dimensions: weights }),
      });
      const data = await res.json();
      if (res.ok) {
        setSavedWeights(weights);
        setSaveStatus({ type: 'success', message: 'Weights saved. New jobs will use these weights.' });
      } else {
        setSaveStatus({ type: 'error', message: data.error ?? 'Save failed.' });
      }
    } catch {
      setSaveStatus({ type: 'error', message: 'Network error. Save failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Rescore all ───────────────────────────────────────────────────────────────
  const handleRescore = async () => {
    setShowRescoreConfirm(false);
    setIsRescoring(true);
    setRescoreStatus(null);
    try {
      const res = await fetch('/api/weights/rescore', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setRescoreStatus({
          type: 'success',
          message: `Rescored ${data.updated} jobs (${data.skipped} skipped, ${data.failed} failed).`,
        });
        // Refresh preview after rescore
        setPreviewJobIds(ids => [...ids]);
      } else {
        setRescoreStatus({ type: 'error', message: data.error ?? 'Rescore failed.' });
      }
    } catch {
      setRescoreStatus({ type: 'error', message: 'Network error. Rescore failed.' });
    } finally {
      setIsRescoring(false);
    }
  };

  const dimKeys = Object.keys(DIMENSION_META);

  if (isLoadingWeights) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading weight configuration…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Sliders className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 leading-none">Weight Configuration Engine</h1>
              <p className="text-xs text-slate-500 mt-0.5">Tune how each dimension influences match scores</p>
            </div>
          </div>

          {/* Total weight indicator */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
              isValid
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {isValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>{Math.round(total)} / 100 pts</span>
            </div>

            {isDirty && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 text-xs font-semibold transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={!isValid || !isDirty || isSaving}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isValid && isDirty && !isSaving
                  ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {isSaving ? 'Saving…' : 'Save Weights'}
            </button>
          </div>
        </div>

        {/* Weight distribution bar */}
        <div className="max-w-7xl mx-auto px-6 pb-3">
          <div className="h-1.5 rounded-full bg-slate-800 flex overflow-hidden">
            {dimKeys.map(key => {
              const w = weights[key]?.weight ?? 0;
              const meta = DIMENSION_META[key];
              if (!w) return null;
              return (
                <div
                  key={key}
                  className="h-full transition-all duration-300"
                  style={{ width: `${w}%`, backgroundColor: meta.color }}
                  title={`${meta.label}: ${w}pts`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Status banners ────────────────────────────────────────────────────── */}
      {saveStatus && (
        <div className={`max-w-7xl mx-auto px-6 pt-4`}>
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${
            saveStatus.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}>
            {saveStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            {saveStatus.message}
          </div>
        </div>
      )}

      {rescoreStatus && (
        <div className="max-w-7xl mx-auto px-6 pt-3">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${
            rescoreStatus.type === 'success'
              ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}>
            {rescoreStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            {rescoreStatus.message}
          </div>
        </div>
      )}

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-5 gap-6">

        {/* LEFT: Sliders (3/5) */}
        <div className="col-span-3 space-y-3">

          {/* Forward-only info pill */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <Lock className="w-3 h-3 text-slate-500 shrink-0" />
            <span>
              <span className="text-slate-300 font-semibold">Forward-only by default</span> — saved weights apply to new scrapes.
              Use <span className="text-violet-400 font-semibold">Rescore All</span> below to retroactively update existing jobs.
            </span>
          </div>

          {/* Dimension sliders */}
          {dimKeys.map(key => {
            const meta = DIMENSION_META[key];
            const value = weights[key]?.weight ?? 0;
            const savedValue = savedWeights[key]?.weight ?? 0;
            const changed = value !== savedValue;

            return (
              <div
                key={key}
                className={`rounded-xl border p-4 transition-all ${
                  changed
                    ? 'bg-slate-900 border-slate-700'
                    : 'bg-slate-900/40 border-slate-800/80'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg leading-none">{meta.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-200">{meta.label}</span>
                        {changed && (
                          <span className="text-[9px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            modified
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug max-w-xs">{meta.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {changed && (
                      <span className="text-[11px] text-slate-600 line-through">{savedValue}pts</span>
                    )}
                    <span
                      className="text-xl font-black tabular-nums leading-none"
                      style={{ color: meta.color }}
                    >
                      {value}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">pts</span>
                  </div>
                </div>

                {/* Slider */}
                <div className="relative">
                  <input
                    id={`slider-${key}`}
                    type="range"
                    min={0}
                    max={40}
                    step={1}
                    value={value}
                    onChange={e => handleSlider(key, Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-800 outline-none"
                    style={{
                      accentColor: meta.color,
                      background: `linear-gradient(to right, ${meta.color} 0%, ${meta.color} ${(value / 40) * 100}%, rgb(30 41 59) ${(value / 40) * 100}%, rgb(30 41 59) 100%)`,
                    }}
                  />
                  {/* Tick marks */}
                  <div className="flex justify-between mt-1 px-0.5">
                    {[0, 10, 20, 30, 40].map(tick => (
                      <span key={tick} className="text-[9px] text-slate-700">{tick}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Validation warning */}
          {!isValid && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Weights total <strong>{Math.round(total)}</strong> pts — must equal exactly 100.
                {total > 100
                  ? ` Reduce by ${Math.round(total - 100)} pts.`
                  : ` Add ${Math.round(100 - total)} pts.`}
              </span>
            </div>
          )}

          {/* Rescore All section */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-slate-400" />
                  Rescore Existing Jobs
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-snug max-w-sm">
                  Re-applies the <strong className="text-slate-400">currently saved</strong> weights to all {' '}
                  <strong className="text-slate-400">135</strong> stored jobs.
                  Scores and rankingData will be updated; semanticData is preserved.
                  Each job's <code className="text-violet-400 text-[10px]">rankingConfigVersion</code> records which config was active.
                </p>
              </div>
              {!showRescoreConfirm ? (
                <button
                  onClick={() => setShowRescoreConfirm(true)}
                  disabled={isRescoring || isDirty}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    isRescoring || isDirty
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                  }`}
                >
                  {isRescoring ? (
                    <><RefreshCw className="w-3 h-3 animate-spin" /> Rescoring…</>
                  ) : (
                    <><Zap className="w-3 h-3" /> Rescore All</>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-amber-400 font-medium">Confirm?</span>
                  <button
                    onClick={handleRescore}
                    className="px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-bold rounded-lg transition-all"
                  >Yes, Rescore</button>
                  <button
                    onClick={() => setShowRescoreConfirm(false)}
                    className="px-2.5 py-1.5 bg-slate-800 text-slate-400 text-xs font-bold rounded-lg"
                  >Cancel</button>
                </div>
              )}
            </div>
            {isDirty && (
              <p className="text-[11px] text-amber-500/70 mt-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                Save your weight changes before rescoring.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT: Live Preview (2/5) */}
        <div className="col-span-2 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-bold text-slate-200">Live Score Preview</h2>
            {isPreviewLoading && (
              <div className="w-3 h-3 rounded-full border-2 border-violet-400 border-t-transparent animate-spin ml-auto" />
            )}
          </div>

          <p className="text-[11px] text-slate-500 leading-snug -mt-2">
            These 3 jobs recompute in real-time as you move sliders, using their stored fit vectors.
            No API calls are made until you save.
          </p>

          {/* Preview cards */}
          {previews.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 animate-pulse">
                  <div className="h-3 bg-slate-800 rounded w-3/4 mb-2" />
                  <div className="h-2 bg-slate-800 rounded w-1/2 mb-4" />
                  <div className="h-8 bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {previews.map(job => {
                const delta = job.newScore - job.oldScore;
                const absDelta = Math.abs(delta);
                const isUp = delta > 0;
                const isFlat = delta === 0;

                return (
                  <div
                    key={job.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition-all hover:border-slate-700"
                  >
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-slate-200 leading-snug line-clamp-1">
                        {job.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{job.company}</p>
                    </div>

                    {/* Score comparison */}
                    <div className="flex items-center gap-3">
                      {/* Old score */}
                      <div className="text-center">
                        <div className={`text-2xl font-black tabular-nums ${scoreColor(job.oldScore)}`}>
                          {job.oldScore}
                        </div>
                        <div className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">current</div>
                      </div>

                      {/* Arrow */}
                      <div className="flex-1 flex items-center gap-1">
                        <div className="h-px flex-1 bg-slate-800" />
                        <ArrowRight className="w-3 h-3 text-slate-700" />
                        <div className="h-px flex-1 bg-slate-800" />
                      </div>

                      {/* New score */}
                      <div className="text-center">
                        <div className={`text-2xl font-black tabular-nums ${scoreColor(job.newScore)}`}>
                          {job.newScore}
                        </div>
                        <div className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">preview</div>
                      </div>

                      {/* Delta badge */}
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black ${
                        isFlat
                          ? 'bg-slate-800 text-slate-500'
                          : isUp
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {isFlat ? (
                          <Minus className="w-3 h-3" />
                        ) : isUp ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>{isFlat ? '—' : `${isUp ? '+' : '−'}${absDelta}`}</span>
                      </div>
                    </div>

                    {/* Mini score bar */}
                    <div className="mt-3 space-y-1">
                      <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${scoreBg(job.newScore)}`}
                          style={{ width: `${job.newScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Weight breakdown table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-bold text-slate-400">Dimension Weights</span>
            </div>
            <div className="divide-y divide-slate-800/60">
              {dimKeys.map(key => {
                const meta = DIMENSION_META[key];
                const value = weights[key]?.weight ?? 0;
                return (
                  <div key={key} className="flex items-center px-4 py-2 gap-3">
                    <span className="text-sm">{meta.emoji}</span>
                    <span className="text-xs text-slate-400 flex-1 leading-snug">{meta.label}</span>
                    <div className="w-16 h-1 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${(value / 40) * 100}%`, backgroundColor: meta.color }}
                      />
                    </div>
                    <span
                      className="text-xs font-black tabular-nums w-8 text-right"
                      style={{ color: meta.color }}
                    >
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* What's NOT configurable */}
          <div className="rounded-xl border border-slate-800/50 bg-slate-900/20 p-4">
            <h4 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              Engineering-owned (not exposed)
            </h4>
            <ul className="space-y-1 text-[11px] text-slate-600">
              <li>• Company tier baseline scores (Tier 1 = 90, Tier 2 = 70)</li>
              <li>• ConfidenceCalculator thresholds (0.4 / 0.2)</li>
              <li>• Seniority tier score multipliers (Chief = 1.0, VP = 0.76…)</li>
              <li>• Semantic enrichment gating threshold (rule score ≥ 40)</li>
              <li>• DecisionEngine rule predicates and verdict labels</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
