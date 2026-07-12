import React from "react";

interface OptimizationPlay {
  dimension: string;
  title: string;
  play: string;
  impact: string;
}

interface OpportunityPanelProps {
  opportunities: OptimizationPlay[];
}

export const OpportunityPanel: React.FC<OpportunityPanelProps> = ({
  opportunities,
}) => {

  if (!opportunities || opportunities.length === 0) {
    return null;
  }

  return (

    <div className="space-y-4">

      <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
        Recommended Improvements
      </h3>

      {opportunities.map((item, idx) => (

        <div
          key={idx}
          className="border rounded-xl p-4 bg-slate-50"
        >

          <div className="flex justify-between">

            <div>

              <div className="font-bold">
                {item.title}
              </div>

              <div className="text-xs text-slate-500 mt-1">
                {item.dimension}
              </div>

            </div>

            <span
  className={`text-xs font-bold uppercase ${
    item.impact === "HIGH IMPACT"
      ? "text-emerald-700"
      : "text-amber-700"
  }`}
>
  {item.impact === "HIGH IMPACT" ? "↑ " : "→ "}
  {item.impact}
</span>

          </div>

          <p className="mt-3 text-sm leading-relaxed">
            {item.play}
          </p>

        </div>

      ))}

    </div>
  );
};