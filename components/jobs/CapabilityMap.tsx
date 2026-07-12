import React from "react";

interface FitDimensionFact {
  name: string;
  weight: number;
  rawScore: number;
  weightedScore: number;
}

interface CapabilityMapProps {
  breakdown: FitDimensionFact[];
}

const DimensionLabelMap: Record<string, string> = {
  "Executive Seniority": "Executive Seniority",
  "Leadership Scale": "Leadership Scale",
  "Functional Expertise": "Functional Expertise",
  "Career Trajectory": "Career Trajectory",
  "Industry Experience": "Industry Experience",
  "Location Preference": "Location Preference",
  "Company Health": "Company Health",
  "hardRequirementFit": "Hard Requirements"
};

export const CapabilityMap: React.FC<CapabilityMapProps> = ({
  breakdown,
}) => {

  if (!breakdown || breakdown.length === 0) {
    return null;
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm space-y-5">

      <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
        Capability Breakdown
      </h3>

      {breakdown.map((item) => {

        const score = Math.round(item.rawScore * 100);
       

        return (

          <div
            key={item.name}
            className="space-y-2"
          >

            <div className="flex justify-between items-center">

              <div>

                <div className="font-semibold text-sm">
                  {DimensionLabelMap[item.name] ?? item.name}
                </div>

                <div className="text-xs text-slate-500">
                  Weight {item.weight}%
                </div>

              </div>

              <div className="text-right">

                <div className="font-bold text-slate-900">
                  {score}/100
                </div>

                <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-bold">
  +{item.weightedScore.toFixed(1)} pts
</span>

              </div>

            </div>

            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">

              <div
                className={`h-full rounded-full ${
                  score >= 80
                    ? "bg-emerald-500"
                    : score >= 60
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
                style={{
  width: `${score}%`,
}}
              />

            </div>

          </div>

        );

      })}

    </div>
  );
};