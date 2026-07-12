// components/ExecutiveBrief.tsx
import React, { useState } from 'react';
import { DecisionTrace } from '../lib/ranking/ontology/types';
import { RecruiterVerdict } from './RecruiterVerdict';
import { CapabilityMap } from './CapabilityMap';
import { OpportunityPanel } from './OpportunityPanel';
import { RequirementCard } from './RequirementCard';

export const ExecutiveBrief: React.FC<{ trace: DecisionTrace }> = ({ trace }) => {
  const { summary, assessments, opportunities } = trace;
  const [showLogic, setShowLogic] = useState(false);

  const matched = assessments.filter(a => a.verified);
  const unverified = assessments.filter(a => !a.verified);

  return (
    <div className="space-y-8 bg-white max-w-4xl mx-auto p-6 text-slate-900 font-sans antialiased">
      
      {/* 🚀 1. Dynamic Recruiter Verdict Component Block */}
      <RecruiterVerdict trace={trace} />

      {/* 🚀 2. Factual Capability Allocation Map Layout Grid */}
      <CapabilityMap assessments={assessments} />

      {/* 3. Short-Effort Opportunities Panel Checklist */}
      <OpportunityPanel opportunities={opportunities} assessments={assessments} />

      {/* 4. Verified Target Match Cards List */}
      {matched.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Verified Target Matches</h3>
          <div className="grid grid-cols-1 gap-4">
            {matched.map(assessment => (
              <RequirementCard key={assessment.requirement.id} assessment={assessment} />
            ))}
          </div>
        </div>
      )}

      {/* 5. Unverified Target Focus Cards List */}
      {unverified.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Unverified Requirements</h3>
          <div className="grid grid-cols-1 gap-4">
            {unverified.map(assessment => (
              <RequirementCard key={assessment.requirement.id} assessment={assessment} />
            ))}
          </div>
        </div>
      )}

      {/* 🚀 9. See how this was evaluated (Collapsible Logs) */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60 shadow-sm">
        <button 
          onClick={() => setShowLogic(!showLogic)}
          className="w-full flex justify-between items-center p-4 text-xs font-black text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none uppercase tracking-wide"
        >
          <span>See how this was evaluated</span>
          <span>{showLogic ? '▼ Close Evaluation Logs' : '▶ Expand Evaluation Logs'}</span>
        </button>
        {showLogic && (
          <div className="p-4 border-t border-slate-200 bg-white text-xs space-y-2 font-mono text-[11px]">
            <div className="grid grid-cols-4 gap-2 p-3 bg-slate-900 font-bold text-slate-300 rounded">
              <div>Employer Target Mandate</div>
              <div>Matched As</div>
              <div>Match Type</div>
              <div>Verification Status</div>
              {assessments.map(a => (
                <React.Fragment key={a.requirement.id}>
                  <div className="text-white truncate">{a.requirement.label}</div>
                  <div className="text-blue-400 truncate">{a.match.matchedConceptLabel || 'None'}</div>
                  <div className="text-indigo-400 font-bold">{a.match.type}</div>
                  <div className={a.verified ? 'text-emerald-400' : 'text-amber-400'}>
                    {a.verified ? 'VERIFIED' : 'NOT VERIFIED'}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};