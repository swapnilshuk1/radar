import React from "react";

interface RecruiterVerdictProps {
  verdict: string;
  priority: string;
  matchScore: number;
  summary: string;
  reasoning: string[];
  strengths: string[];
  concerns: string[];
}

export const RecruiterVerdict: React.FC<RecruiterVerdictProps> = ({
  verdict,
  priority,
  matchScore,
  summary,
  reasoning,
  strengths,
  concerns,
}) => {
  return (
    <div className="border-l-4 border-slate-900 bg-slate-50 rounded-r-xl p-6 space-y-5">

      <div className="flex justify-between items-center">

        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            Recruiter Verdict
          </div>

                  <div className="flex items-center gap-2 mt-1">
  <span
  className={`w-2.5 h-2.5 rounded-full ${
    priority === "Strong Match"
      ? "bg-emerald-500"
      : priority === "Potential Match"
      ? "bg-amber-500"
      : "bg-rose-500"
  }`}
/>

  <div className="text-lg font-bold text-slate-900">
    {priority}
  </div>
</div>
        </div>

        <div className="text-right">

          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
  Match Score
</div>

<div className="text-3xl font-black text-slate-900 leading-none mt-1">
  {matchScore}
</div>
        </div>
      </div>

      {summary && (
        <p className="text-sm leading-relaxed text-slate-700">
          {summary}
        </p>
      )}

      {reasoning.length > 0 && (
        <div>

          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">
            Why the engine scored this
          </div>

          <ul className="space-y-1">
            {reasoning.map((item, idx) => (
              <li key={idx} className="text-sm text-slate-700">
                • {item}
              </li>
            ))}
          </ul>

        </div>
      )}

      {strengths.length > 0 && (
        <div>

          <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 mb-2">
            Strong Signals
          </div>

          <div className="flex flex-wrap gap-2">

            {strengths.map((item, idx) => (
              <span
                key={idx}
                className="px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-xs"
              >
                {item}
              </span>
            ))}

          </div>

        </div>
      )}

      {concerns.length > 0 && (
        <div>

          <div className="text-[11px] font-bold uppercase tracking-wide text-amber-700 mb-2">
            Watch Items
          </div>

          <ul className="space-y-1">

            {concerns.map((item, idx) => (
              <li key={idx} className="text-sm text-slate-700">
                • {item}
              </li>
            ))}

          </ul>

        </div>
      )}

    </div>
  );
};