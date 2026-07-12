export interface EvidenceMetadata {
  kind: "strength" | "gap";
  priority: number;
  title: string;
  description: string;
  icon: string;
}

export const EvidenceCatalog: Record<string, EvidenceMetadata> = {
  "HIGH_FUNCTIONAL_MATCH": { 
    kind: "strength", priority: 100, 
    title: "Proven functional expertise", 
    description: "Your experience closely matches the core responsibilities of this role.",
    icon: "check" 
  },
  "EXECUTIVE_SCOPE": { 
    kind: "strength", priority: 90, 
    title: "Executive scope alignment", 
    description: "Your leadership scale is appropriate for this level.",
    icon: "briefcase" 
  },
  "LOCATION_ALIGNMENT": { 
    kind: "strength", priority: 80, 
    title: "Location alignment", 
    description: "Your location matches the role's requirements.",
    icon: "map-pin" 
  },
  "PROMOTIONAL_TRAJECTORY": { 
    kind: "strength", priority: 70, 
    title: "Strong career trajectory", 
    description: "This role represents a logical next step in your career.",
    icon: "trending-up" 
  },
  "SENIORITY_MATCH": { 
    kind: "strength", priority: 90, 
    title: "Seniority match", 
    description: "Your years of experience align well with this position.",
    icon: "user" 
  },
  "FUNCTIONAL_ALIGNMENT": { 
    kind: "strength", priority: 80, 
    title: "Functional alignment", 
    description: "Your core skills overlap with the role requirements.",
    icon: "settings" 
  },
  "FUNCTIONAL_OVERLAP": { 
    kind: "strength", priority: 60, 
    title: "Functional overlap", 
    description: "There is clear relevance to your background.",
    icon: "layers" 
  },
  "LOCATION_MISMATCH": { 
    kind: "gap", priority: 90, 
    title: "Location mismatch", 
    description: "The role's location requirements may limit compatibility.",
    icon: "map-pin" 
  },
  "VERIFY_COMPANY_HEALTH": { 
    kind: "gap", priority: 80, 
    title: "Verify company health", 
    description: "Consider performing additional due diligence on the company's stability.",
    icon: "alert-circle" 
  },
  "LIMITED_ALIGNMENT": { 
    kind: "gap", priority: 100, 
    title: "Limited alignment", 
    description: "There are few clear indicators of fit for this role.",
    icon: "info" 
  },
  "HARD_REQUIREMENT_MISMATCH": { 
    kind: "gap", priority: 100, 
    title: "Requirement mismatch", 
    description: "You do not meet the core hard requirements for this position.",
    icon: "x-circle" 
  }
};