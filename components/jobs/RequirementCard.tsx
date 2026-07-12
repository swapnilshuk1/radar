import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { EvidenceCatalog } from "../../lib/ranking/decision/catalog";

interface RequirementCardProps {
  engineCode: string;
  variant: "strength" | "gap";
}

export const RequirementCard: React.FC<RequirementCardProps> = ({
  engineCode,
  variant,
}) => {

  const entry =
    EvidenceCatalog[engineCode];

  const title =
    entry?.title ??
    engineCode;

  const description =
    entry?.description ??
    "";

  const strength =
    variant === "strength";

  return (

    <div
      className={`border rounded-xl p-4 shadow-sm ${
        strength
          ? "bg-white border-slate-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >

      <div className="flex gap-3">

        <div className="pt-1">

          {strength ? (
            <CheckCircle2
              className="w-5 h-5 text-emerald-600"
            />
          ) : (
            <AlertTriangle
              className="w-5 h-5 text-amber-600"
            />
          )}

        </div>

        <div className="flex-1">

          <div className="font-bold">
            {title}
          </div>

          {description && (
            <p className="text-sm text-slate-600 mt-1">
              {description}
            </p>
          )}

          {process.env.NODE_ENV === "development" && (
  <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-400">
    Engine Code: {engineCode}
  </div>
)}

        </div>

      </div>

    </div>
  );
};