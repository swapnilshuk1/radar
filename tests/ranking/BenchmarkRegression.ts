// tests/ranking/BenchmarkRegression.ts
// Baseline regression execution runner. Compiles and matches scoring behaviors against expected values.

import { RankingEngine } from '../../lib/ranking/RankingService';
import { getCandidateProfile } from '../../lib/ranking/config';

interface LabeledJob {
  title: string;
  company: string;
  location: string;
  snippet: string;
  expectedRecommendation: string;
  basis: string;
}

const profile = getCandidateProfile();

const benchmarkDataset: LabeledJob[] = [
  {
    title: "Chief Marketing Officer (CMO)",
    company: "BMW India",
    location: "Gurugram",
    snippet: "Looking for an executive CMO with 15+ years experience. Candidate must have managed 40-member performance marketing teams, ₹1.5 Cr P&L scales, and reported directly to board members. Deep experience in Salesforce CDP, lifecycle marketing, and digital transformations required.",
    expectedRecommendation: "Apply Immediately",
    basis: "High functional match, board exposure, matching location, and correct leadership scale."
  },
  {
    title: "VP Performance Marketing",
    company: "VML",
    location: "Gurugram",
    snippet: "Requires 12+ years experience in digital marketing, GTM strategy, and CRM setups. Experience managing $10M+ marketing fee-books and performance channels.",
    expectedRecommendation: "Apply This Week",
    basis: "Strong functional CRM/performance match and appropriate location. Director to VP seniority level."
  },
  {
    title: "Transformation Lead",
    company: "TATA Consultancy Services",
    location: "Bengaluru",
    snippet: "Looking for an agile transformation lead with experience in Scrum, PMO, and project management. 5-8 years experience.",
    expectedRecommendation: "Explore Context",
    basis: "Correct location and transformation function, but junior-to-mid level seniority compared to VP/SVP target."
  },
  {
    title: "VP Digital Marketing",
    company: "Acme Corp",
    location: "Mumbai",
    snippet: "Requires VP digital marketing leader with experience in GTM, CRM, and digital platforms. Must be located in Mumbai office (100% on-site).",
    expectedRecommendation: "Monitor Closely",
    basis: "Functional match is high, but location preference is different (Mumbai on-site vs Gurugram preferred)."
  },
  {
    title: "Junior Coordinator Marketing",
    company: "Tiny Startup",
    location: "Remote",
    snippet: "Entry level marketing assistant with 0-1 years experience to help run social media channels and cold emails.",
    expectedRecommendation: "Skip/Archive",
    basis: "Junior seniority mismatch. Excluded by rules engine gating."
  }
];

function runRegressionSuite() {
  console.log("[RADAR-BENCHMARK] Initializing regression validation checks...");
  let passed = 0;

  for (const item of benchmarkDataset) {
    const result = RankingEngine.evaluate({
      title: item.title,
      snippet: item.snippet,
      location: item.location,
      company: item.company
    }, profile);

    const recommendation = result.rejected 
      ? "Skip/Archive" 
      : result.explanation?.priority 
        ? (result.explanation.priority === "Must Review" ? "Apply Immediately" : 
           result.explanation.priority === "Strong Match" ? "Apply This Week" :
           result.explanation.priority === "Worth Reviewing" ? "Monitor Closely" : 
           result.explanation.priority === "Possible Match" ? "Explore Context" : "Skip/Archive")
        : "Skip/Archive";

    const matches = recommendation === item.expectedRecommendation;
    if (matches) {
      passed++;
      console.log(`[PASS] ${item.title} -> Match: "${recommendation}"`);
    } else {
      console.error(`[FAIL] ${item.title} -> Expected: "${item.expectedRecommendation}", Got: "${recommendation}". Basis: ${item.basis}`);
      console.error(`  FitVector Details:`);
      for (const [name, dim] of Object.entries(result.explanation?.evalResult?.fitVector || {})) {
        console.error(`    - ${name}: Score=${(dim as any).score}, Confidence=${(dim as any).confidence}`);
      }
      if (result.rejected) {
        console.error(`    - REJECTED: ${result.rejectReason}`);
      }
    }
  }

  const accuracy = (passed / benchmarkDataset.length) * 100;
  console.log(`\n[RADAR-BENCHMARK] Results: Passed ${passed}/${benchmarkDataset.length} (${accuracy}% Accuracy)`);

  if (accuracy < 80) {
    console.error("FAIL: Accuracy fell below 80% baseline constraint.");
    process.exit(1);
  } else {
    console.log("SUCCESS: Benchmark validation passed!");
    process.exit(0);
  }
}

runRegressionSuite();
