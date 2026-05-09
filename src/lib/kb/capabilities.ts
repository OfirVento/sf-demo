/**
 * Static excerpts from the RCA knowledge base, §1 (RCA Capability List).
 *
 * Used by the Layer 1 Executive view's "Learn more" drawer on the RCA
 * capabilities grid. Keyed by canonical capability name. Only the
 * capabilities surfaced by `rcaOpportunities` in the demo payload are
 * included — re-runnable from the actual KB if the list grows.
 */

export type KbCapability = {
  name: string;
  /** One-line description from KB §1, paraphrased lightly. */
  description: string;
};

export const KB_CAPABILITIES: KbCapability[] = [
  {
    name: 'Pricing Procedures (BRE)',
    description:
      'Step-based pricing execution flows built on Expression Sets and Decision Tables — replaces CPQ price rules and QCP with a declarative, auditable pipeline.',
  },
  {
    name: 'Salesforce Pricing',
    description:
      'Dynamic pricing engine: price books, price adjustment schedules, attribute-based adjustments, bundle adjustments, derived pricing, cost books, and the price waterfall.',
  },
  {
    name: 'Constraint Modeling Language (CML)',
    description:
      'Domain-specific language for declaring product types, attributes, relationships, and constraints; compiled to Expression Sets and solved sub-second even at 10,000+ line items.',
  },
  {
    name: 'Product Configurator',
    description:
      'Guided configuration of complex and bundled products using either BRE rules or CML — ensures valid configurations before quote/order save.',
  },
  {
    name: 'Asset Lifecycle Management',
    description:
      'Tracks the customer install base as Assets with full lifecycle: initial sale, amendment, renewal, cancellation, transfer, rollback — each generating AssetAction + AssetStatePeriod records.',
  },
  {
    name: 'Transaction Management',
    description:
      'Quote and order capture — create, price, configure, approve, and convert quotes to orders; manages the full sales transaction lifecycle including groups and ramp deals.',
  },
  {
    name: 'Dynamic Revenue Orchestrator (DRO)',
    description:
      'Post-order fulfillment engine: decomposes orders into fulfillment plans with steps, dependencies, jeopardy rules, external callouts, and retry/fallout handling.',
  },
  {
    name: 'Revenue Cloud Billing',
    description:
      'Invoice generation from billing schedules, billing treatments, billing policies, milestone-based billing, payment processing, credit memos, refunds, write-offs, and collections.',
  },
  {
    name: 'Advanced Approvals',
    description:
      'Configurable multi-step approval workflows for quotes and orders using ApprovalSubmission and ApprovalWorkItem objects — replaces the CPQ Advanced Approvals managed package at no extra cost.',
  },
  {
    name: 'Revenue Recognition',
    description:
      'Revenue schedules, revenue treatments, revenue distributions, and GL account assignment rules — supports ASC 606 and IFRS 15 compliance.',
  },
  {
    name: 'Agentforce for Revenue Management',
    description:
      'AI agents with pre-built topics and actions for pricing recommendations, contract analysis, anomaly detection, and automated product recommendations.',
  },
];

/**
 * Heuristically match a free-text `rcaCapability` string from the payload to
 * the canonical KB §1 capability. Falls back to the first significant prefix
 * if no match is found.
 */
/**
 * Specific-first token map. Each entry is (token in opportunity name) →
 * (canonical KB capability name). Order matters: more specific tokens come
 * first so "Pricing Procedures + Salesforce Pricing" matches Pricing
 * Procedures, not Salesforce Pricing.
 */
const TOKEN_MAP: Array<[string, string]> = [
  ['pricing procedure', 'Pricing Procedures (BRE)'],
  ['constraint modeling', 'Constraint Modeling Language (CML)'],
  ['cml', 'Constraint Modeling Language (CML)'],
  ['product configurator', 'Product Configurator'],
  ['asset lifecycle', 'Asset Lifecycle Management'],
  ['transaction management', 'Transaction Management'],
  ['dynamic revenue orchestrator', 'Dynamic Revenue Orchestrator (DRO)'],
  ['dro', 'Dynamic Revenue Orchestrator (DRO)'],
  ['revenue cloud billing', 'Revenue Cloud Billing'],
  ['billing', 'Revenue Cloud Billing'],
  ['advanced approval', 'Advanced Approvals'],
  ['revenue recognition', 'Revenue Recognition'],
  ['agentforce', 'Agentforce for Revenue Management'],
  ['salesforce pricing', 'Salesforce Pricing'],
];

export function lookupKbCapability(rcaCapability: string): KbCapability | null {
  const norm = rcaCapability.toLowerCase();
  for (const [token, canonical] of TOKEN_MAP) {
    if (norm.includes(token)) {
      const found = KB_CAPABILITIES.find((c) => c.name === canonical);
      if (found) return found;
    }
  }
  return null;
}
