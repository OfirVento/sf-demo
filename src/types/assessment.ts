/* eslint-disable */
/**
 * Auto-generated from inputs/assessment-schema.json.
 * Do not edit by hand. Run `npm run generate:types`.
 */

export type ComplexityTier = 'Low' | 'Medium' | 'High' | 'Very High';
export type Severity = 'Info' | 'Low' | 'Medium' | 'High' | 'Critical';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';
export type ExpansionModule =
  | 'DRO'
  | 'Billing'
  | 'Advanced_Approvals'
  | 'Usage_Management'
  | 'Revenue_Recognition'
  | 'CLM'
  | 'Product_Discovery'
  | 'Token_Overage'
  | 'Agentforce';
export type SourceType =
  | 'QCP_JavaScript'
  | 'Apex_Class'
  | 'Apex_Trigger'
  | 'Price_Rule'
  | 'Product_Rule'
  | 'Discount_Schedule'
  | 'Summary_Variable'
  | 'Lookup_Query';
export type UsageSignal = 'Confirmed_Usage' | 'Active_Or_Referenced' | 'Unknown' | 'Deprecated_Or_Inactive';
export type RcaTargetPattern =
  | 'Pricing_Procedure'
  | 'Price_Adjustment_Method'
  | 'CML_Constraint'
  | 'CML_Relationship'
  | 'Declarative_Configuration'
  | 'Flow_Extension'
  | 'Apex_Invocable_Extension'
  | 'Manual_Design_Required';
export type DraftConfidence = 'High' | 'Medium' | 'Low' | 'Manual_Review_Required';
export type CandidateLanguage = 'cml' | 'apex' | 'json' | 'pseudocode';
export type TalkingPointContext = 'discovery_call' | 'sow_review' | 'executive_meeting' | 'salesforce_handoff';

/**
 * Vento CPQ→RCA Assessment Tool — full assessment payload contract. The app consumes this at runtime; every visualization, AI claim, and migration draft is grounded in this file.
 */
export interface AssessmentPayload {
  meta: {
    assessmentId: string;
    generatedAt: string;
    orgName: string;
    /**
     * Hashed/redacted Salesforce org ID
     */
    orgIdentifier: string;
    truthLabel: 'real_org_data' | 'sample_data';
    schemaVersion: '1.0';
  };
  orgProfile: {
    edition: string;
    cpqVersion: string;
    activeUsers: number;
    dataVolume: {
      products: number;
      activeQuotes: number;
      historicalQuotes: number;
      activeContracts: number;
      activeSubscriptions: number;
    };
    integrations: {
      name: string;
      type: 'erp' | 'billing' | 'tax' | 'cpq_extension' | 'other';
      direction: 'inbound' | 'outbound' | 'bidirectional';
    }[];
  };
  verdict: {
    recommendation: 'Proceed' | 'Proceed_With_Caution' | 'Needs_Deeper_Discovery';
    rationale: string;
  };
  complexityScores: {
    overall: ComplexityTier;
    overallNumeric: number;
    dimensions: {
      pricingLogic: ScoredDimension;
      productCatalog: ScoredDimension;
      customCode: ScoredDimension;
      dataMigration: ScoredDimension;
      integrations: ScoredDimension;
      deprecatedConfig: ScoredDimension;
    };
  };
  /**
   * @minItems 3
   * @maxItems 7
   */
  topConcerns:
    | [Concern, Concern, Concern]
    | [Concern, Concern, Concern, Concern]
    | [Concern, Concern, Concern, Concern, Concern]
    | [Concern, Concern, Concern, Concern, Concern, Concern]
    | [Concern, Concern, Concern, Concern, Concern, Concern, Concern];
  loeEstimate: {
    tier: ComplexityTier;
    weeksLow: number;
    weeksHigh: number;
    confidence: ConfidenceLevel;
    confidenceLimitingFactors: string[];
    primaryDrivers: string[];
    suggestedPhases: Phase[];
    sowCaveats: string[];
    changeOrderRisks: string[];
    disclaimer: string;
  };
  rcaOpportunities: RcaOpportunity[];
  expansionSignals: ExpansionSignal[];
  codeInventory: CodeArtifact[];
  rcaBenefitMapping: BenefitMappingEntry[];
  salesTalkingPoints: TalkingPoint[];
  implementationFindings: ImplementationFinding[];
  aiNarratives: {
    executive: string;
    sales: string;
    salesforce: string;
  };
}
export interface ScoredDimension {
  score: number;
  tier: ComplexityTier;
  /**
   * Short factual phrase, e.g. '47 price rules, 13 QCP scripts'
   */
  signal: string;
  evidence: EvidenceTrail;
}
export interface EvidenceTrail {
  /**
   * Executive-readable bullets, 3–5 items
   *
   * @minItems 1
   * @maxItems 5
   */
  summary:
    | [string]
    | [string, string]
    | [string, string, string]
    | [string, string, string, string]
    | [string, string, string, string, string];
  detailed: {
    metric: string;
    value: string | number;
    source: string;
  }[];
  raw: {
    artifactReferences: string[];
    metadataExtracts?: {
      [k: string]: unknown;
    };
  };
}
export interface Concern {
  id: string;
  title: string;
  severity: Severity;
  audienceFraming: {
    executive: {
      headline: string;
      impact: string;
      nextAction: string;
    };
    sales: {
      headline: string;
      sowCaveat: string;
      talkingPoint: string;
    };
    salesforce: {
      headline: string;
      migrationRisk: string;
    };
  };
  evidence: EvidenceTrail;
}
export interface Phase {
  name: string;
  durationWeeks: {
    low: number;
    high: number;
  };
  description: string;
}
export interface RcaOpportunity {
  id: string;
  cpqFinding: string;
  /**
   * Canonical RCA term per KB Section 1
   */
  rcaCapability: string;
  rcaTargetPattern: string;
  businessBenefit: string;
  expansionSignal: string | null;
  confidence: ConfidenceLevel;
  evidence: EvidenceTrail;
}
export interface ExpansionSignal {
  module: ExpansionModule;
  triggerCondition: string;
  /**
   * 'May be relevant if...' style. Never 'you should buy'.
   */
  consultativeFraming: string;
  confidence: ConfidenceLevel;
  evidence: EvidenceTrail;
}
export interface CodeArtifact {
  id: string;
  name: string;
  sourceType: SourceType;
  sourceCode: string;
  businessPurpose: string;
  usageSignal: UsageSignal;
  complexityScore: number;
  dependencies: Dependency[];
  recommendedRcaTarget: RcaTargetPattern;
  conversionConfidence: DraftConfidence;
  draft: MigrationDraft;
  evidence: EvidenceTrail;
}
export interface Dependency {
  type: 'object' | 'field' | 'rule' | 'integration';
  name: string;
  reference: string;
}
export interface MigrationDraft {
  generatedCandidate: string;
  candidateLanguage: CandidateLanguage;
  plainLanguageExplanation: string;
  targetPatternReasoning: string;
  preservedBehavior: string[];
  changedBehavior: string[];
  unknowns: string[];
  requiredTests: string[];
  humanReviewRequired: boolean;
  reviewReasons: string[];
}
export interface BenefitMappingEntry {
  cpqPainPoint: string;
  rcaCapability: string;
  businessBenefit: string;
  salesforceExpansion: string | null;
  confidence: ConfidenceLevel;
  evidence: EvidenceTrail;
}
export interface TalkingPoint {
  context: TalkingPointContext;
  point: string;
  supportingData: string;
}
export interface ImplementationFinding {
  category: string;
  severity: Severity;
  finding: string;
  technicalDetail: string;
  recommendedAction: string;
  evidence: EvidenceTrail;
}
