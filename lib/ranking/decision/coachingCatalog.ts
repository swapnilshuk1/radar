// lib/ranking/decision/coachingCatalog.ts

export interface CoachingRule {
  dimension: string;
  threshold: number;
  title: string;
  play: string;
  impact: "HIGH IMPACT" | "MEDIUM IMPACT";
}

export const CoachingCatalog: CoachingRule[] = [
  {
    dimension: "leadershipFit",
    threshold: 75,
    title: "Quantify Enterprise Scale Managed",
    play: "Explicitly highlight corporate P&L ownership scale, cross-functional agile orchestration, and direct executive stakeholder reporting lines.",
    impact: "HIGH IMPACT"
  },
  {
    dimension: "functionalFit",
    threshold: 80,
    title: "Highlight Strategic Transformation Metrics",
    play: "Inject discrete performance outcomes demonstrating major digital capability building, platform migrations, or corporate delivery metrics.",
    impact: "HIGH IMPACT"
  },
  {
    dimension: "locationFit",
    threshold: 80,
    title: "Address Relocation Parameters Proactively",
    play: "Establish clear readiness for localized corporate target hubs or hybrid regional travel allocation models early in initial screening loops.",
    impact: "MEDIUM IMPACT"
  },
  {
    dimension: "careerProgressionFit",
    threshold: 70,
    title: "Exemplify Leadership Velocity",
    play: "Frame recent corporate trajectory steps to emphasize continuous progression velocity and organizational scope expansion.",
    impact: "MEDIUM IMPACT"
  }
];