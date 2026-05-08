/**
 * Build-time payload generator for the Vento CPQ→RCA Assessment Tool demo.
 *
 * Produces inputs/assessment-payload.json per BUILD-SPEC §2A.
 * Re-runnable: `npm run generate:payload`. Validates against the schema after writing.
 *
 * Conventions:
 *  - codeInventory holds 20 illustrative artifacts curated for review.
 *  - Org-wide totals live in complexityScores.dimensions[*].signal and drive narrative numbers.
 *  - Every entity with an `evidence` field carries summary + detailed + raw.
 *  - Pricing logic → Pricing_Procedure / Price_Adjustment_Method targets; configuration → CML.
 *  - Decision-table involvement is surfaced in targetPatternReasoning.
 */

import { writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import type {
  AssessmentPayload,
  CodeArtifact,
  Concern,
  EvidenceTrail,
  RcaOpportunity,
  ExpansionSignal,
  TalkingPoint,
  ImplementationFinding,
  BenefitMappingEntry,
  Severity,
  DraftConfidence,
  ConfidenceLevel,
  SourceType,
} from '../src/types/assessment';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ev(
  summary: string[],
  detailed: { metric: string; value: string | number; source: string }[],
  artifactReferences: string[],
  metadataExtracts?: Record<string, unknown>,
): EvidenceTrail {
  return {
    summary: summary as EvidenceTrail['summary'],
    detailed,
    raw: {
      artifactReferences,
      ...(metadataExtracts ? { metadataExtracts } : {}),
    },
  };
}

// ---------------------------------------------------------------------------
// Code inventory — 20 curated artifacts
// ---------------------------------------------------------------------------

const codeInventory: CodeArtifact[] = [
  // ---------- QCP (5) ----------
  {
    id: 'q-001',
    name: 'Enterprise segment discount (QCP)',
    sourceType: 'QCP_JavaScript',
    sourceCode: `// QCP: Apply 10% additional discount for Enterprise segment customers.
// Runs in browser after every quote calculation; touches every line.
export function onAfterCalculate(quoteModel, quoteLineModels, conn) {
  return new Promise((resolve, reject) => {
    try {
      const segment = quoteModel.record["SBQQ__Account__r"]["Segment__c"];
      if (segment === "Enterprise") {
        quoteLineModels.forEach((line) => {
          line.record["SBQQ__AdditionalDiscount__c"] = 10;
        });
      }
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}`,
    businessPurpose:
      'Applies a flat 10% additional discount to every quote line when the account segment is Enterprise.',
    usageSignal: 'Confirmed_Usage',
    complexityScore: 28,
    dependencies: [
      { type: 'field', name: 'Account.Segment__c', reference: 'SBQQ__Account__r.Segment__c' },
      { type: 'field', name: 'QuoteLine.SBQQ__AdditionalDiscount__c', reference: 'SBQQ__QuoteLine__c' },
    ],
    recommendedRcaTarget: 'Pricing_Procedure',
    conversionConfidence: 'High',
    draft: {
      generatedCandidate: `Pricing Procedure: PRC_SegmentDiscount_v1
├── Step 1 · Initialize Price (PriceBookEntry lookup)
├── Step 2 · Lookup Segment Discount
│     Decision Table: DT_SegmentDiscount
│       Inputs:  Account.Segment__c, Product.Family
│       Output:  DiscountPct (Decimal)
│       Row:     Enterprise, *  →  10.0
├── Step 3 · Apply Discount
│     Expression: NetPrice = ListPrice × (1 - DiscountPct / 100)
└── Step 4 · Calculate Total
      Expression: TotalPrice = NetPrice × Quantity`,
      candidateLanguage: 'pseudocode',
      plainLanguageExplanation:
        'Enterprise segment discount becomes a server-side pricing-procedure step backed by a Decision Table. The discount is auditable in the price waterfall and no longer depends on browser execution.',
      targetPatternReasoning:
        'Pricing logic must run server-side and be auditable. Implemented as a Pricing Procedure step backed by a Decision Table keyed on Account.Segment.',
      preservedBehavior: [
        'Enterprise accounts receive a 10% additional discount.',
        'Discount applies to every line on the quote.',
      ],
      changedBehavior: [
        'Discount is computed server-side and visible in the price waterfall (vs. a browser-side overwrite).',
      ],
      unknowns: [
        'Whether the 10% is intended to stack with other promotional discounts or replace them.',
      ],
      requiredTests: [
        'Enterprise account → every line shows DiscountPct = 10 in the waterfall.',
        'Non-Enterprise account → no segment discount applied.',
        'Discount stacks correctly with volume-based PriceAdjustmentSchedule.',
      ],
      humanReviewRequired: false,
      reviewReasons: [],
    },
    evidence: ev(
      [
        'Active QCP referenced by the standard quote calculator.',
        'Touches every quote line on every recalc.',
        'Discount logic is keyed on a single account field (Segment__c).',
      ],
      [
        { metric: 'Lines of code', value: 14, source: 'QCP source' },
        { metric: 'Triggered on', value: 'onAfterCalculate', source: 'QCP source' },
        { metric: 'Account fields read', value: 1, source: 'Static analysis' },
      ],
      ['QuoteCalculatorPlugin.js', 'SBQQ__Account__c.Segment__c'],
    ),
  },
  {
    id: 'q-002',
    name: 'Bundle-aware pricing adjustment (QCP)',
    sourceType: 'QCP_JavaScript',
    sourceCode: `// QCP: Adjust price of bundle children based on parent bundle attributes.
// Loops bundles, walks children, applies attribute-driven uplift.
export function onAfterCalculate(quoteModel, quoteLineModels) {
  return new Promise((resolve) => {
    const bundles = quoteLineModels.filter((l) => l.record["SBQQ__Bundle__c"]);
    bundles.forEach((b) => {
      const tier = b.record["Bundle_Tier__c"];
      const uplift = tier === "Premium" ? 0.15 : tier === "Plus" ? 0.08 : 0;
      const childIds = b.record["SBQQ__BundledLines__r"] || [];
      quoteLineModels
        .filter((l) => childIds.includes(l.record["Id"]))
        .forEach((c) => {
          c.record["SBQQ__ListPrice__c"] *= 1 + uplift;
        });
    });
    resolve();
  });
}`,
    businessPurpose:
      'Increases child line list price by a bundle-tier uplift (Premium = 15%, Plus = 8%).',
    usageSignal: 'Active_Or_Referenced',
    complexityScore: 52,
    dependencies: [
      { type: 'field', name: 'QuoteLine.Bundle_Tier__c', reference: 'SBQQ__QuoteLine__c' },
      { type: 'field', name: 'QuoteLine.SBQQ__Bundle__c', reference: 'SBQQ__QuoteLine__c' },
    ],
    recommendedRcaTarget: 'Pricing_Procedure',
    conversionConfidence: 'Medium',
    draft: {
      generatedCandidate: `Pricing Procedure: PRC_BundleTierUplift_v1
├── Step 1 · Resolve Parent Bundle Context (BRE Expression Set)
├── Step 2 · Lookup Tier Uplift
│     Decision Table: DT_BundleTierUplift
│       Inputs:  ParentBundle.Tier
│       Output:  UpliftPct
│       Rows:    Premium → 15.0, Plus → 8.0, Standard → 0.0
└── Step 3 · Apply Uplift to Child Lines
      Expression: ListPrice = ListPrice × (1 + UpliftPct / 100)`,
      candidateLanguage: 'pseudocode',
      plainLanguageExplanation:
        'Bundle-tier uplift becomes a Pricing Procedure with a Decision Table lookup keyed on the parent bundle tier. The procedure resolves the parent context and applies the uplift to each child line.',
      targetPatternReasoning:
        'Pricing logic that depends on bundle context. Implemented as a Pricing Procedure step backed by a Decision Table on the parent bundle tier; resolution of the parent context uses BRE Context Service mappings.',
      preservedBehavior: [
        'Premium bundles uplift child list price by 15%.',
        'Plus bundles uplift child list price by 8%.',
        'Standard bundles produce no uplift.',
      ],
      changedBehavior: [
        'Resolution of parent bundle context is declarative via Context Service mappings rather than QCP traversal.',
      ],
      unknowns: [
        'Whether uplift should apply when the bundle is amended mid-term.',
        'Whether the tier list is exhaustive — additional tiers may exist.',
      ],
      requiredTests: [
        'Premium bundle child line shows 15% uplift in the waterfall.',
        'Adding a child to an existing Premium bundle inherits the uplift.',
        'Removing the parent line clears the uplift on orphaned children.',
      ],
      humanReviewRequired: false,
      reviewReasons: [],
    },
    evidence: ev(
      [
        'QCP iterates bundle parents and applies uplift to child lines.',
        'Tier list observed: Premium, Plus, Standard.',
        'Uplift applied to ListPrice (not NetPrice) — order in waterfall matters.',
      ],
      [
        { metric: 'Lines of code', value: 18, source: 'QCP source' },
        { metric: 'Bundle tiers observed', value: 3, source: 'Static analysis' },
        { metric: 'Bundles in catalog', value: 28, source: 'Org scan' },
      ],
      ['QuoteCalculatorPlugin.js', 'Bundle_Tier__c', 'SBQQ__BundledLines__r'],
    ),
  },
  {
    id: 'q-003',
    name: 'External tax pre-calculation callout (QCP)',
    sourceType: 'QCP_JavaScript',
    sourceCode: `// QCP: Synchronous callout to internal tax pre-calc service.
// Blocks calculation; failures fall back to flat rate.
export async function onAfterCalculate(quoteModel, quoteLineModels) {
  for (const line of quoteLineModels) {
    try {
      const resp = await fetch(
        \`https://internal-tax.example.com/precalc?sku=\${line.record.SBQQ__ProductCode__c}&amount=\${line.record.SBQQ__NetPrice__c}\`,
        { headers: { Authorization: 'Bearer ' + window.__taxToken } },
      );
      const data = await resp.json();
      line.record["Estimated_Tax__c"] = data.tax;
    } catch (e) {
      line.record["Estimated_Tax__c"] = line.record.SBQQ__NetPrice__c * 0.08;
    }
  }
}`,
    businessPurpose:
      'Calls an internal tax pre-calculation service for each line and writes the result back; falls back to a flat 8% on failure.',
    usageSignal: 'Confirmed_Usage',
    complexityScore: 71,
    dependencies: [
      { type: 'integration', name: 'Internal tax pre-calc service', reference: 'internal-tax.example.com' },
      { type: 'field', name: 'Estimated_Tax__c', reference: 'SBQQ__QuoteLine__c' },
    ],
    recommendedRcaTarget: 'Apex_Invocable_Extension',
    conversionConfidence: 'Manual_Review_Required',
    draft: {
      generatedCandidate: `// Pricing Procedure Apex hook (ProcedurePlanOption.ApexClass)
public class TaxPrecalcInvocable {
    @InvocableMethod(label='Pre-calculate tax')
    public static List<Result> precalc(List<Request> reqs) {
        // 1. Issue HTTP callout to internal tax service per line.
        // 2. On 4xx/5xx or timeout, fall back to flat 8% as today.
        // 3. Return Estimated_Tax for the procedure to write to QuoteLineDetail.
        // ⚠️ Synchronous external callouts inside a pricing procedure
        //    must respect the platform's pricing call-time budget.
        //    Consider asynchronous callout + revalidation if latency exceeds budget.
        return new List<Result>();
    }
    public class Request { @InvocableVariable public Id quoteLineId; @InvocableVariable public Decimal netPrice; @InvocableVariable public String sku; }
    public class Result  { @InvocableVariable public Id quoteLineId; @InvocableVariable public Decimal estimatedTax; }
}`,
      candidateLanguage: 'apex',
      plainLanguageExplanation:
        'External callouts cannot be expressed declaratively. This becomes an Apex hook in the Pricing Procedure that calls the existing tax service. The 8% fallback and authentication contract need to be re-validated against the Avalara integration before this is wired live.',
      targetPatternReasoning:
        'External callout for runtime pricing — KB §3.1 / §5.7 require an Apex Invocable Extension hook in the pricing procedure. Cannot be replaced by a Decision Table because the response depends on a remote service.',
      preservedBehavior: [
        'Per-line tax estimate written back to a custom field-equivalent on QuoteLineDetail.',
        '8% flat fallback on failure.',
      ],
      changedBehavior: [
        'Token-based auth in window.__taxToken must move to a Named Credential.',
        'Pricing call-time budget enforced; long callouts may need to move asynchronous.',
      ],
      unknowns: [
        'Why an internal tax service is called when Avalara is also integrated — possible duplication.',
        'Whether the 8% fallback is a contractual requirement or accidental safety net.',
        'Whether the service supports batch (per-quote) calls instead of per-line.',
      ],
      requiredTests: [
        'Successful callout writes estimate to the waterfall.',
        'Service 5xx triggers 8% fallback and surfaces a warning.',
        'Latency under SLA across a 50-line quote.',
        'Auth via Named Credential, not embedded token.',
      ],
      humanReviewRequired: true,
      reviewReasons: [
        'External callout in pricing path requires latency + auth re-validation.',
        'Possible duplication with the Avalara tax integration.',
        '8% fallback semantics need finance sign-off.',
      ],
    },
    evidence: ev(
      [
        'Synchronous external callout per line on every recalc.',
        'Per-line write to Estimated_Tax__c.',
        'Hardcoded fallback rate of 8%.',
      ],
      [
        { metric: 'Lines of code', value: 20, source: 'QCP source' },
        { metric: 'External endpoint', value: 'internal-tax.example.com', source: 'QCP source' },
        { metric: 'Fallback rate', value: '8%', source: 'QCP source' },
      ],
      ['QuoteCalculatorPlugin.js', 'Estimated_Tax__c', 'Internal tax service'],
    ),
  },
  {
    id: 'q-004',
    name: 'Custom rounding logic (QCP)',
    sourceType: 'QCP_JavaScript',
    sourceCode: `// QCP: Round NetPrice to nearest 0.05 for currency display consistency.
export function onAfterCalculate(quoteModel, quoteLineModels) {
  return new Promise((resolve) => {
    quoteLineModels.forEach((line) => {
      const np = line.record["SBQQ__NetPrice__c"];
      if (typeof np === "number") {
        line.record["SBQQ__NetPrice__c"] = Math.round(np * 20) / 20;
      }
    });
    resolve();
  });
}`,
    businessPurpose:
      'Rounds every line\'s NetPrice to the nearest five cents for display and invoicing consistency.',
    usageSignal: 'Confirmed_Usage',
    complexityScore: 18,
    dependencies: [
      { type: 'field', name: 'QuoteLine.SBQQ__NetPrice__c', reference: 'SBQQ__QuoteLine__c' },
    ],
    recommendedRcaTarget: 'Pricing_Procedure',
    conversionConfidence: 'High',
    draft: {
      generatedCandidate: `Pricing Procedure: PRC_RoundingPolicy_v1
└── Final Step · Apply Rounding
      Expression: NetPrice = ROUND(NetPrice × 20) / 20`,
      candidateLanguage: 'pseudocode',
      plainLanguageExplanation:
        'Rounding becomes a final step in the Pricing Procedure. The expression is identical to the QCP logic and the result is visible in the waterfall.',
      targetPatternReasoning:
        'Deterministic rounding is a Pricing Procedure expression step. No Decision Table required because the rounding rule is constant across products.',
      preservedBehavior: ['NetPrice rounded to nearest 0.05 on every line.'],
      changedBehavior: ['Rounding occurs server-side and is visible in the price waterfall.'],
      unknowns: ['Whether multi-currency rounding follows the same rule (CAD, EUR, etc.).'],
      requiredTests: [
        'Line at $9.997 rounds to $10.00.',
        'Line at $9.974 rounds to $9.95.',
        'Multi-currency lines respect the same rule.',
      ],
      humanReviewRequired: false,
      reviewReasons: [],
    },
    evidence: ev(
      [
        'Trivial QCP: single rounding step on NetPrice.',
        'Runs after every quote calculation.',
      ],
      [
        { metric: 'Lines of code', value: 11, source: 'QCP source' },
        { metric: 'Fields written', value: 1, source: 'Static analysis' },
      ],
      ['QuoteCalculatorPlugin.js'],
    ),
  },
  {
    id: 'q-005',
    name: 'Recursive subscription proration (QCP)',
    sourceType: 'QCP_JavaScript',
    sourceCode: `// QCP: Recursively traverse co-termed subscription chain to align prorated price.
// Walks parent → root, then back down, adjusting each segment's NetPrice.
export function onAfterCalculate(quoteModel, lines) {
  function walk(line, depth = 0) {
    if (depth > 12) return; // safety cap
    const parentId = line.record["SBQQ__RequiredBy__c"];
    if (parentId) {
      const parent = lines.find((l) => l.record["Id"] === parentId);
      if (parent) walk(parent, depth + 1);
    }
    const start = new Date(line.record["SBQQ__StartDate__c"]);
    const end = new Date(line.record["SBQQ__EndDate__c"]);
    const days = Math.max(1, (end - start) / 86400000);
    const factor = days / 365;
    line.record["SBQQ__NetPrice__c"] *= factor;
    (line.record["SBQQ__BundledLines__r"] || []).forEach((cId) => {
      const child = lines.find((l) => l.record["Id"] === cId);
      if (child) walk(child, depth + 1);
    });
  }
  return new Promise((resolve) => {
    lines.filter((l) => !l.record["SBQQ__RequiredBy__c"]).forEach((l) => walk(l));
    resolve();
  });
}`,
    businessPurpose:
      'Walks the subscription dependency tree to align prorated NetPrice across co-termed lines, applying a day-based proration factor at each level.',
    usageSignal: 'Active_Or_Referenced',
    complexityScore: 88,
    dependencies: [
      { type: 'field', name: 'QuoteLine.SBQQ__RequiredBy__c', reference: 'SBQQ__QuoteLine__c' },
      { type: 'field', name: 'QuoteLine.SBQQ__StartDate__c', reference: 'SBQQ__QuoteLine__c' },
      { type: 'field', name: 'QuoteLine.SBQQ__EndDate__c', reference: 'SBQQ__QuoteLine__c' },
    ],
    recommendedRcaTarget: 'Manual_Design_Required',
    conversionConfidence: 'Manual_Review_Required',
    draft: {
      generatedCandidate: `// MANUAL DESIGN REQUIRED — do not auto-generate
//
// The recursive traversal of co-termed subscription chains has no clean
// declarative analogue. Two RCA paths are viable; pick one with finance:
//
//   Option A (preferred) · Use BillingTreatment.ProrationPolicy +
//     AssetStatePeriod records to express each segment of the co-termed
//     subscription. Pricing Procedure becomes a thin wrapper.
//
//   Option B · Custom Apex invocable that mirrors the recursion, called
//     from the pricing procedure as an Apex hook. Lower migration risk,
//     keeps the bespoke business semantic intact.
//
// Trade-off: Option A is "more RCA-native" but requires re-modelling the
// asset chain; Option B is faster to deliver but preserves a piece of
// Apex that finance must own.`,
      candidateLanguage: 'pseudocode',
      plainLanguageExplanation:
        'Recursive co-termination semantics require a deliberate design choice between native asset modelling (preferred) and an Apex invocable that mirrors the QCP recursion. Cannot be auto-converted because the right answer depends on how finance models co-termed subscriptions.',
      targetPatternReasoning:
        'KB §3.7 marks recursive cross-line aggregation as a Custom Apex Invocable case. Combined with proration, this overlaps with BillingTreatment.ProrationPolicy and AssetStatePeriod modelling — a design call, not a code translation.',
      preservedBehavior: [
        'Co-termed subscription segments end on aligned dates.',
        'Day-based proration factor applied per segment.',
      ],
      changedBehavior: [
        'Asset modelling may shift from QuoteLine recursion to AssetAction + AssetStatePeriod records.',
      ],
      unknowns: [
        'Whether the depth cap of 12 is ever exceeded in practice.',
        'Whether finance treats the proration as a pricing event or a billing event.',
        'Whether multiple roots ever co-exist on a single quote.',
      ],
      requiredTests: [
        'Happy path: two-level co-termed bundle aligns end dates and prorates correctly.',
        'Happy path: three-level chain prorates without depth-cap clipping.',
        'Happy path: mid-term amendment recomputes proration without breaking the asset chain.',
        'Edge case: chain deeper than 12 levels — verify behavior is intentional (clip, error, or escalate) rather than silently truncated.',
        'Edge case: circular SBQQ__RequiredBy__c reference — must terminate with a clear error; today the depth cap masks this.',
        'Edge case: amendment that cancels the parent line strands an orphaned bundled child segment — proration must produce a defensible result, not a divide-by-zero.',
        'Migration cutover: asset already migrated to native RCA lifecycle is re-amended through the legacy proration path — confirm whether the legacy path is still reachable post-cutover and what the expected behavior is.',
      ],
      humanReviewRequired: true,
      reviewReasons: [
        'Recursive cross-line traversal has no declarative equivalent.',
        'Choice between asset-native modelling and Apex invocable requires finance + delivery alignment.',
        'Depth cap of 12 suggests defensive coding around an edge case worth understanding.',
      ],
    },
    evidence: ev(
      [
        'Recursive QCP touching dependent + bundled lines.',
        'Day-based proration factor applied at every depth.',
        'Defensive depth cap of 12 levels.',
      ],
      [
        { metric: 'Lines of code', value: 26, source: 'QCP source' },
        { metric: 'Recursion depth cap', value: 12, source: 'QCP source' },
        { metric: 'Fields read', value: 4, source: 'Static analysis' },
      ],
      ['QuoteCalculatorPlugin.js', 'SBQQ__RequiredBy__c'],
    ),
  },

  // ---------- Apex (4) ----------
  {
    id: 'a-001',
    name: 'Cost-plus pricing trigger (Apex)',
    sourceType: 'Apex_Trigger',
    sourceCode: `// Apex Trigger: Calculate price as Cost + 25% margin on quote line update.
trigger CPQ_CostPlusPricing on SBQQ__QuoteLine__c (before update) {
    Set<Id> productIds = new Set<Id>();
    for (SBQQ__QuoteLine__c ql : Trigger.new) {
        productIds.add(ql.SBQQ__Product__c);
    }
    Map<Id, Product2> products = new Map<Id, Product2>(
        [SELECT Id, Cost__c FROM Product2 WHERE Id IN :productIds]
    );
    for (SBQQ__QuoteLine__c ql : Trigger.new) {
        Product2 p = products.get(ql.SBQQ__Product__c);
        if (p != null && p.Cost__c != null) {
            ql.SBQQ__NetPrice__c = p.Cost__c * 1.25;
        }
    }
}`,
    businessPurpose:
      'Sets each quote line\'s NetPrice to product Cost × 1.25 on update, implementing a cost-plus margin pricing rule.',
    usageSignal: 'Confirmed_Usage',
    complexityScore: 35,
    dependencies: [
      { type: 'object', name: 'Product2', reference: 'Product2' },
      { type: 'field', name: 'Product2.Cost__c', reference: 'Product2.Cost__c' },
    ],
    recommendedRcaTarget: 'Pricing_Procedure',
    conversionConfidence: 'High',
    draft: {
      generatedCandidate: `Pricing Procedure: PRC_CostPlusMargin_v1
├── Step 1 · Initialize Price (PriceBookEntry)
├── Step 2 · Retrieve Cost
│     Decision Table: DT_CostLookup
│       Source:  CostBookEntry (CostBook = "Standard Costs")
│       Inputs:  Product2Id
│       Output:  UnitCost (Currency)
├── Step 3 · Apply Margin
│     Expression: NetPrice = UnitCost × 1.25
└── Step 4 · Calculate Total`,
      candidateLanguage: 'pseudocode',
      plainLanguageExplanation:
        'Cost-plus pricing becomes a Pricing Procedure with a Cost Book. No Apex required: the cost is sourced from CostBookEntry via a Decision Table lookup, then the margin is applied as a procedure expression.',
      targetPatternReasoning:
        'KB §3.2 maps cost-plus pricing triggers directly to a Pricing Procedure with a Cost Book. Decision Table lookup keyed on Product2Id replaces the SOQL in the trigger.',
      preservedBehavior: [
        'NetPrice = Cost × 1.25 for every line with a defined cost.',
      ],
      changedBehavior: [
        'Cost source moves from a custom Cost__c field to the standard CostBookEntry object.',
        'Margin can vary by product family via Decision Table rows if the business wants.',
      ],
      unknowns: [
        'Whether cost data lives only in Cost__c today or already in a separate Cost system.',
      ],
      requiredTests: [
        'Line with defined cost is repriced at Cost × 1.25.',
        'Line with missing cost preserves manual NetPrice.',
        'Cost change after line creation is reflected on next recalc.',
      ],
      humanReviewRequired: false,
      reviewReasons: [],
    },
    evidence: ev(
      [
        'Trigger fires on every QuoteLine update.',
        'Bulk-safe SOQL on Product2.Cost__c.',
        'Single multiplication formula — no branching.',
      ],
      [
        { metric: 'Lines of code', value: 14, source: 'Apex source' },
        { metric: 'SOQL queries', value: 1, source: 'Static analysis' },
        { metric: 'DML', value: 0, source: 'Static analysis' },
      ],
      ['CPQ_CostPlusPricing.trigger', 'Product2.Cost__c'],
    ),
  },
  {
    id: 'a-002',
    name: 'Cross-line discount validator (Apex)',
    sourceType: 'Apex_Class',
    sourceCode: `// Apex Class: Cross-line discount cap validator invoked from a process builder flow.
public class CrossLineDiscountValidator {
    @InvocableMethod(label='Validate cross-line discount cap')
    public static List<Result> validate(List<Id> quoteIds) {
        List<Result> out = new List<Result>();
        for (Id qId : quoteIds) {
            Decimal weighted = 0;
            Decimal total = 0;
            for (SBQQ__QuoteLine__c ql : [
                SELECT SBQQ__NetPrice__c, SBQQ__Discount__c
                FROM   SBQQ__QuoteLine__c
                WHERE  SBQQ__Quote__c = :qId
            ]) {
                Decimal d = ql.SBQQ__Discount__c == null ? 0 : ql.SBQQ__Discount__c;
                Decimal np = ql.SBQQ__NetPrice__c == null ? 0 : ql.SBQQ__NetPrice__c;
                weighted += d * np;
                total += np;
            }
            Decimal effective = total == 0 ? 0 : weighted / total;
            Result r = new Result();
            r.isValid = effective <= 30;
            r.message = r.isValid ? '' : 'Weighted discount exceeds 30% cap.';
            out.add(r);
        }
        return out;
    }
    public class Result { @InvocableVariable public Boolean isValid; @InvocableVariable public String message; }
}`,
    businessPurpose:
      'Computes the weighted average discount across all quote lines and returns an invalid result when it exceeds 30%.',
    usageSignal: 'Confirmed_Usage',
    complexityScore: 48,
    dependencies: [
      { type: 'object', name: 'SBQQ__QuoteLine__c', reference: 'SBQQ__QuoteLine__c' },
      { type: 'field', name: 'QuoteLine.SBQQ__Discount__c', reference: 'SBQQ__QuoteLine__c' },
    ],
    recommendedRcaTarget: 'Apex_Invocable_Extension',
    conversionConfidence: 'Medium',
    draft: {
      generatedCandidate: `// RCA Apex Invocable Action — kept because cross-line aggregation has no
// direct declarative equivalent (KB §3.7).
public class RCA_WeightedDiscountValidator {
    @InvocableMethod(label='Validate weighted discount cap')
    public static List<Result> validate(List<Id> quoteIds) {
        List<Result> out = new List<Result>();
        for (Id qId : quoteIds) {
            Decimal weighted = 0; Decimal total = 0;
            for (QuoteLineItem qli : [
                SELECT UnitPrice, Discount FROM QuoteLineItem WHERE QuoteId = :qId
            ]) {
                Decimal d = (qli.Discount != null ? qli.Discount : 0);
                Decimal up = (qli.UnitPrice != null ? qli.UnitPrice : 0);
                weighted += d * up;
                total += up;
            }
            Decimal effective = total == 0 ? 0 : weighted / total;
            Result r = new Result();
            r.isValid = effective <= 30;
            r.message = r.isValid ? '' : 'Weighted discount exceeds 30% cap.';
            out.add(r);
        }
        return out;
    }
    public class Result { @InvocableVariable public Boolean isValid; @InvocableVariable public String message; }
}`,
      candidateLanguage: 'apex',
      plainLanguageExplanation:
        'Weighted-average discount across quote lines is a true cross-line aggregation. The Apex invocable is kept (RCA does not provide a declarative equivalent for weighted aggregations), but rewritten against the standard QuoteLineItem object and called from the validation flow.',
      targetPatternReasoning:
        'KB §3.7 Quick Reference: complex cross-line summary logic still requires Apex Invocable Action. Implemented as a Pricing Procedure step backed by an Apex hook on the procedure plan; declarative routes (BRE Expression Set with SUM) cannot express weighted averages.',
      preservedBehavior: [
        'Validation fails if the weighted-average discount exceeds 30%.',
        'Empty quote yields a passing result.',
      ],
      changedBehavior: [
        'Source object changes from SBQQ__QuoteLine__c to QuoteLineItem.',
        'Invocable is callable from a Pricing Procedure step or a validation flow.',
      ],
      unknowns: [
        'Whether the 30% cap is global or varies by segment / region.',
      ],
      requiredTests: [
        'Quote with weighted discount of 31% returns invalid.',
        'Quote with weighted discount of 30% returns valid.',
        'Lines with null Discount are treated as 0.',
      ],
      humanReviewRequired: false,
      reviewReasons: [],
    },
    evidence: ev(
      [
        'Invocable class called from a process flow on quote save.',
        'Single SOQL across all quote lines.',
        'Hardcoded 30% cap.',
      ],
      [
        { metric: 'Lines of code', value: 25, source: 'Apex source' },
        { metric: 'SOQL queries', value: 1, source: 'Static analysis' },
        { metric: 'Hardcoded thresholds', value: 1, source: 'Static analysis' },
      ],
      ['CrossLineDiscountValidator.cls'],
    ),
  },
  {
    id: 'a-003',
    name: 'Custom amendment service (Apex)',
    sourceType: 'Apex_Class',
    sourceCode: `// Apex Class: Bespoke mid-term amendment service. ~140 lines elided.
public class CPQ_AmendmentService {
    public static Id createAmendment(Id contractId) {
        SBQQ__Quote__c amendment = new SBQQ__Quote__c();
        amendment.SBQQ__Type__c = 'Amendment';
        amendment.SBQQ__MasterContract__c = contractId;
        amendment.SBQQ__StartDate__c = Date.today();
        // Manual proration of remaining term per line:
        //   - Walk active subscriptions
        //   - Compute days remaining
        //   - Build prorated quote lines
        //   - Apply co-termination rules
        //   - Generate credit lines for cancellations
        // ... (~140 lines of subscription cloning + proration math)
        insert amendment;
        return amendment.Id;
    }
}`,
    businessPurpose:
      'Creates an amendment quote from an existing contract: clones active subscription lines, prorates remaining term, co-terminates segments, and emits credit lines for cancellations.',
    usageSignal: 'Confirmed_Usage',
    complexityScore: 82,
    dependencies: [
      { type: 'object', name: 'SBQQ__Quote__c', reference: 'SBQQ__Quote__c' },
      { type: 'object', name: 'SBQQ__Subscription__c', reference: 'SBQQ__Subscription__c' },
      { type: 'rule', name: 'Custom proration rules', reference: 'CPQ_AmendmentService.cls' },
    ],
    recommendedRcaTarget: 'Declarative_Configuration',
    conversionConfidence: 'High',
    draft: {
      generatedCandidate: `// RCA: zero Apex required — use the Initiate Amendment lifecycle action.
//
// Option A (preferred) · Flow-based amendment
//   - Action: ConnectAPI · CommerceOrders.amendAsset(assetId)
//   - Platform auto-creates: new asset version (old → Superseded, new → Active),
//     AssetAction (type = Amend), AssetStatePeriod, prorated billing schedule
//     adjustments, and credit memo for prepaid unused period.
//
// Option B · Apex thin wrapper for legacy callers
public class RCA_AmendmentService {
    @InvocableMethod(label='Amend Asset')
    public static List<Id> amendAsset(List<Id> assetIds) {
        ConnectApi.CommerceOrders.amendAsset(assetIds[0]);
        return assetIds;
    }
}`,
      candidateLanguage: 'apex',
      plainLanguageExplanation:
        'The 140 lines of custom amendment logic are replaced by the native Initiate Amendment lifecycle action. Proration, co-termination, asset versioning, and credit memos are all handled by the platform via AssetAction + AssetStatePeriod + BillingTreatment.ProrationPolicy.',
      targetPatternReasoning:
        'KB §3.6 maps custom amendment Apex directly to the Transaction Management Initiate Amendment action. This is one of the highest-value migrations: replacing bespoke logic with native lifecycle behavior. Declarative path preferred; Apex thin wrapper only as a callsite shim.',
      preservedBehavior: [
        'Amendment quote created from active contract.',
        'Remaining term prorated per line.',
        'Co-termination of subscription segments.',
        'Credit lines for cancelled scope.',
      ],
      changedBehavior: [
        'Asset chain becomes the source of truth (not custom QuoteLine clones).',
        'Proration policy is configurable on BillingTreatment, not hardcoded in Apex.',
        'Credit memo is a standard CreditMemo record, not a custom credit line.',
      ],
      unknowns: [
        'Whether the existing CPQ amendment has any non-standard behavior worth preserving (e.g., custom approval routing).',
      ],
      requiredTests: [
        'Amend an active asset: AssetAction (Amend) + new AssetStatePeriod created.',
        'Prorated billing schedule generated automatically.',
        'Cancel scope produces a CreditMemo.',
        'Co-term aligns end dates across the asset chain.',
        'Round-trip: amend → renew → cancel preserves audit trail.',
      ],
      humanReviewRequired: false,
      reviewReasons: [],
    },
    evidence: ev(
      [
        '~140 lines of custom amendment + proration logic.',
        'Touches subscription cloning, proration, co-termination, credit handling.',
        'Direct candidate for native Initiate Amendment lifecycle action.',
      ],
      [
        { metric: 'Lines of code', value: 140, source: 'Apex source' },
        { metric: 'Objects touched', value: 4, source: 'Static analysis' },
        { metric: 'Custom proration paths', value: 3, source: 'Static analysis' },
      ],
      ['CPQ_AmendmentService.cls', 'SBQQ__Subscription__c'],
    ),
  },
  {
    id: 'a-004',
    name: 'Quote approval routing trigger (Apex)',
    sourceType: 'Apex_Trigger',
    sourceCode: `// Apex Trigger: Route quote to approver based on discount, deal size, and product mix.
trigger CPQ_QuoteApprovalRouting on SBQQ__Quote__c (before update) {
    for (SBQQ__Quote__c q : Trigger.new) {
        SBQQ__Quote__c old = Trigger.oldMap.get(q.Id);
        if (q.SBQQ__Status__c != 'Approval Required' || old.SBQQ__Status__c == 'Approval Required') continue;
        Decimal d = q.SBQQ__AverageDiscount__c == null ? 0 : q.SBQQ__AverageDiscount__c;
        Decimal a = q.SBQQ__NetAmount__c == null ? 0 : q.SBQQ__NetAmount__c;
        if      (d > 30 || a > 500000)  q.Approver_Group__c = 'VP_Sales';
        else if (d > 20 || a > 250000)  q.Approver_Group__c = 'Director_Sales';
        else if (d > 10 || a > 100000)  q.Approver_Group__c = 'Manager_Sales';
        else                            q.Approver_Group__c = 'Auto_Approve';
    }
}`,
    businessPurpose:
      'Sets an approver group on the quote based on discount thresholds and deal size when the quote enters Approval Required status.',
    usageSignal: 'Confirmed_Usage',
    complexityScore: 41,
    dependencies: [
      { type: 'field', name: 'Quote.SBQQ__AverageDiscount__c', reference: 'SBQQ__Quote__c' },
      { type: 'field', name: 'Quote.Approver_Group__c', reference: 'SBQQ__Quote__c' },
    ],
    recommendedRcaTarget: 'Declarative_Configuration',
    conversionConfidence: 'High',
    draft: {
      generatedCandidate: `// RCA Advanced Approvals (native, no managed package, no Apex):
//
// ApprovalSubmission triggered on Quote when status = Approval Required.
// Routing handled by ApprovalWorkItem rules:
//
//   Rule 1 · WeightedDiscount > 30% OR NetAmount > 500k → VP Sales (level 4)
//   Rule 2 · WeightedDiscount > 20% OR NetAmount > 250k → Director (level 3)
//   Rule 3 · WeightedDiscount > 10% OR NetAmount > 100k → Manager (level 2)
//   Default → Auto-approve (level 1)
//
// Rules expressed as BRE Expression Set rows; no trigger code retained.`,
      candidateLanguage: 'pseudocode',
      plainLanguageExplanation:
        'Quote approval routing is one of the cleanest migrations to RCA Advanced Approvals (free native upgrade — KB §4.3). The four-level threshold table becomes ApprovalWorkItem routing rules; the trigger is deleted entirely.',
      targetPatternReasoning:
        'KB §2.1 + §4.3: CPQ approval routing maps directly to RCA Advanced Approvals. Routing thresholds become declarative ApprovalWorkItem rules; no Apex retained.',
      preservedBehavior: [
        'Four-tier routing with the same discount + amount thresholds.',
        'Auto-approve below all thresholds.',
      ],
      changedBehavior: [
        'Routing is data-driven rather than coded; product owners can adjust thresholds without a deploy.',
      ],
      unknowns: [
        'Whether the discount field used (AverageDiscount vs WeightedDiscount) matches the approver expectation.',
      ],
      requiredTests: [
        'Quote with 35% discount routes to VP Sales.',
        'Quote with $260k amount routes to Director.',
        'Quote below all thresholds auto-approves.',
        'Threshold change in Setup updates routing on next submission.',
      ],
      humanReviewRequired: false,
      reviewReasons: [],
    },
    evidence: ev(
      [
        'Trigger fires only on transition into Approval Required.',
        'Four-tier routing on (discount OR amount).',
        'Maps cleanly to RCA Advanced Approvals.',
      ],
      [
        { metric: 'Lines of code', value: 16, source: 'Apex source' },
        { metric: 'Approver tiers', value: 4, source: 'Apex source' },
      ],
      ['CPQ_QuoteApprovalRouting.trigger'],
    ),
  },

  // ---------- Price rules (4) ----------
  {
    id: 'pr-001',
    name: 'Volume-based discount price rule',
    sourceType: 'Price_Rule',
    sourceCode: `Price Rule: "PR_VolumeDiscount_Standard"
  Active: true
  Conditions Met: All
  Conditions:
    - QuoteLine.Quantity ≥ 10
  Actions:
    - Set QuoteLine.SBQQ__AdditionalDiscount__c = 5
  Calc Order: 200`,
    businessPurpose:
      'Applies a 5% additional discount to any quote line with a quantity of 10 or more.',
    usageSignal: 'Confirmed_Usage',
    complexityScore: 22,
    dependencies: [
      { type: 'field', name: 'QuoteLine.Quantity', reference: 'SBQQ__QuoteLine__c' },
    ],
    recommendedRcaTarget: 'Pricing_Procedure',
    conversionConfidence: 'High',
    draft: {
      generatedCandidate: `Pricing Procedure step (PRC_StandardCommercial_v1)
└── Step "VolumeDiscount"
      Condition:  Quantity ≥ 10
      Action:     ApplyDiscount(percent=5, target=NetPrice)
      WaterfallLabel: "Standard volume discount (qty ≥ 10)"`,
      candidateLanguage: 'pseudocode',
      plainLanguageExplanation:
        'Volume discount becomes a single conditional step in the standard commercial pricing procedure. The waterfall label makes the discount visible to finance.',
      targetPatternReasoning:
        'Simple quantity-keyed pricing rule. Implemented as a Pricing Procedure step with a guard expression — no Decision Table needed for a single threshold.',
      preservedBehavior: [
        'Lines with quantity ≥ 10 receive a 5% additional discount.',
      ],
      changedBehavior: [
        'Discount is visible in the price waterfall with a meaningful label.',
      ],
      unknowns: ['Whether the threshold (10) is product-specific or universal.'],
      requiredTests: [
        'Quantity = 10 receives 5% discount; Quantity = 9 does not.',
        'Step labelled correctly in the price waterfall.',
      ],
      humanReviewRequired: false,
      reviewReasons: [],
    },
    evidence: ev(
      [
        'One of 42 active price rules in the org.',
        'Single condition keyed on Quantity.',
        'Trivial mapping to a Pricing Procedure step.',
      ],
      [
        { metric: 'Conditions', value: 1, source: 'Price rule definition' },
        { metric: 'Actions', value: 1, source: 'Price rule definition' },
      ],
      ['PR_VolumeDiscount_Standard'],
    ),
  },
  {
    id: 'pr-002',
    name: 'Customer tier price override',
    sourceType: 'Price_Rule',
    sourceCode: `Price Rule: "PR_CustomerTier_Override"
  Active: true
  Conditions:
    - Account.Tier__c IN (Gold, Platinum, Diamond)
  Actions:
    - Lookup Query: LQ_CustomerTierPrice
        Match: Product.Family, Account.Tier__c
        Sets:  QuoteLine.SBQQ__SpecialPrice__c
  Calc Order: 250`,
    businessPurpose:
      'Overrides the special price on a quote line with a tier-specific price for Gold/Platinum/Diamond accounts via a lookup table.',
    usageSignal: 'Confirmed_Usage',
    complexityScore: 38,
    dependencies: [
      { type: 'field', name: 'Account.Tier__c', reference: 'Account.Tier__c' },
      { type: 'rule', name: 'Lookup Query LQ_CustomerTierPrice', reference: 'SBQQ__LookupQuery__c' },
    ],
    recommendedRcaTarget: 'Pricing_Procedure',
    conversionConfidence: 'High',
    draft: {
      generatedCandidate: `Pricing Procedure step (PRC_StandardCommercial_v1)
└── Step "CustomerTierOverride"
      Decision Table: DT_CustomerTierPrice
        Inputs:  Product.Family, Account.Tier
        Output:  TierPrice (Currency)
        Rows:    (Family×Tier) → Price for every applicable combination
      Action: Set NetPrice = COALESCE(TierPrice, NetPrice)`,
      candidateLanguage: 'pseudocode',
      plainLanguageExplanation:
        'Lookup Query becomes a Decision Table keyed on Product Family + Account Tier. The pricing procedure step overrides NetPrice when a row matches.',
      targetPatternReasoning:
        'CPQ Lookup Query → BRE Decision Table per KB §2.1 / §3.3. Implemented as a Pricing Procedure step backed by a Decision Table lookup keyed on Product.Family and Account.Tier.',
      preservedBehavior: [
        'Tier-specific price applied for Gold / Platinum / Diamond accounts.',
        'Falls back to standard NetPrice when no row matches.',
      ],
      changedBehavior: [
        'Lookup table is now a maintainable Decision Table editable in Setup.',
      ],
      unknowns: [
        'Whether new tiers are introduced regularly (governance over Decision Table edits).',
      ],
      requiredTests: [
        'Gold account on a covered product family receives the tier price.',
        'Bronze account (uncovered) receives the standard price.',
        'Decision Table refresh after deploy returns new prices (KB §5.2 / P5).',
      ],
      humanReviewRequired: false,
      reviewReasons: [],
    },
    evidence: ev(
      [
        'Lookup-driven price override for premium tiers.',
        'Touches three account tiers and ~12 product families.',
        'Native fit for a BRE Decision Table.',
      ],
      [
        { metric: 'Account tiers covered', value: 3, source: 'Lookup query rows' },
        { metric: 'Product families covered', value: 12, source: 'Lookup query rows' },
      ],
      ['PR_CustomerTier_Override', 'LQ_CustomerTierPrice'],
    ),
  },
  {
    id: 'pr-003',
    name: 'Promotional discount (date-bounded)',
    sourceType: 'Price_Rule',
    sourceCode: `Price Rule: "PR_Promo_Spring26"
  Active: true
  Conditions:
    - TODAY() BETWEEN 2026-03-01 AND 2026-06-30
    - Product.Family = "Add-Ons"
  Actions:
    - Set QuoteLine.SBQQ__AdditionalDiscount__c = 12
  Calc Order: 300`,
    businessPurpose:
      'Applies a 12% additional discount to Add-On products during the Spring 2026 promotion window.',
    usageSignal: 'Active_Or_Referenced',
    complexityScore: 26,
    dependencies: [
      { type: 'field', name: 'Product.Family', reference: 'Product2.Family' },
    ],
    recommendedRcaTarget: 'Pricing_Procedure',
    conversionConfidence: 'Medium',
    draft: {
      generatedCandidate: `Pricing Procedure step (PRC_PromoCampaigns_v1)
└── Step "Spring26Promo"
      Decision Table: DT_PromoCampaigns
        Inputs:  Product.Family, EffectiveDate
        Output:  PromoPct (Decimal)
        Rows:    Add-Ons | 2026-03-01..2026-06-30 → 12.0
      Action: ApplyDiscount(percent=PromoPct)`,
      candidateLanguage: 'pseudocode',
      plainLanguageExplanation:
        'Date-bounded promotional discount becomes a Decision Table entry with effective date. Each promo gets one row; expired promos can be retired without redeploying.',
      targetPatternReasoning:
        'Date-bounded promotional pricing implemented as a Pricing Procedure step backed by a Decision Table keyed on Product.Family and EffectiveDate. Confidence reduced to Medium because the promo cadence and overlap rules need product-team validation.',
      preservedBehavior: [
        'Add-On products receive 12% additional discount within the promo window.',
      ],
      changedBehavior: [
        'Promos are governed by a single Decision Table; promo lifecycle no longer requires a deploy.',
      ],
      unknowns: [
        'Whether multiple overlapping promos can stack.',
        'Whether the cutoff is inclusive or exclusive of the end date.',
      ],
      requiredTests: [
        'Add-On line on 2026-04-15 receives 12% promo discount.',
        'Add-On line on 2026-07-01 does not.',
        'Non-Add-On lines unaffected.',
      ],
      humanReviewRequired: false,
      reviewReasons: [],
    },
    evidence: ev(
      [
        'Date-bounded condition with a hardcoded promo window.',
        'Single product-family scope.',
        'One of multiple seasonal promos in the org.',
      ],
      [
        { metric: 'Promo window days', value: 122, source: 'Date arithmetic' },
        { metric: 'Conditions', value: 2, source: 'Price rule definition' },
      ],
      ['PR_Promo_Spring26'],
    ),
  },
  {
    id: 'pr-004',
    name: 'Multi-currency adjustment rule',
    sourceType: 'Price_Rule',
    sourceCode: `Price Rule: "PR_MultiCurrency_Adjustment"
  Active: true
  Conditions:
    - Quote.CurrencyIsoCode != "USD"
  Actions:
    - Lookup Query: LQ_FXAdjustment
        Match: CurrencyIsoCode
        Sets:  QuoteLine.SBQQ__SpecialPrice__c (UnitPrice × FXAdjustment)
  Calc Order: 280`,
    businessPurpose:
      'Adjusts the line special price by a per-currency adjustment factor for non-USD quotes.',
    usageSignal: 'Confirmed_Usage',
    complexityScore: 32,
    dependencies: [
      { type: 'field', name: 'CurrencyIsoCode', reference: 'CurrencyIsoCode' },
      { type: 'rule', name: 'Lookup Query LQ_FXAdjustment', reference: 'SBQQ__LookupQuery__c' },
    ],
    recommendedRcaTarget: 'Pricing_Procedure',
    conversionConfidence: 'Low',
    draft: {
      generatedCandidate: `Pricing Procedure step (PRC_StandardCommercial_v1)
└── Step "FXAdjustment"
      Decision Table: DT_FXAdjustment
        Input:  CurrencyIsoCode
        Output: AdjustmentFactor (Decimal)
      Action: NetPrice = NetPrice × AdjustmentFactor`,
      candidateLanguage: 'pseudocode',
      plainLanguageExplanation:
        'FX adjustment becomes a Decision Table keyed on CurrencyIsoCode. The pricing procedure multiplies NetPrice by the lookup factor when the quote is non-USD.',
      targetPatternReasoning:
        'Currency-keyed pricing adjustment. Implemented as a Pricing Procedure step backed by a Decision Table keyed on CurrencyIsoCode. Confidence Low because the FX governance model is unknown — refresh cadence, authoritative source, stale-rate behavior, and rounding policy all need finance sign-off before this draft can be trusted as a starting point.',
      preservedBehavior: [
        'Non-USD quote lines adjusted by the per-currency factor.',
      ],
      changedBehavior: [
        'FX factor governance moves to Decision Table refresh schedule (KB §5.2 / P5).',
      ],
      unknowns: [
        'Whether the FX table is refreshed manually or via integration.',
        'Whether stale FX rates have triggered support tickets in the past.',
      ],
      requiredTests: [
        'EUR line picks up the EUR row from DT_FXAdjustment.',
        'USD line bypasses the FX step.',
        'Decision Table refresh after deploy is verified (KB pitfall P5).',
      ],
      humanReviewRequired: false,
      reviewReasons: [],
    },
    evidence: ev(
      [
        'Lookup-driven adjustment for non-USD quotes.',
        'Currencies observed: EUR, GBP, AUD, CAD.',
        'Standard fit for a Decision Table refresh policy.',
      ],
      [
        { metric: 'Currencies covered', value: 4, source: 'Lookup query rows' },
        { metric: 'Conditions', value: 1, source: 'Price rule definition' },
      ],
      ['PR_MultiCurrency_Adjustment', 'LQ_FXAdjustment'],
    ),
  },

  // ---------- Product rules (3) ----------
  {
    id: 'pdr-001',
    name: 'Block Starter + Enterprise Add-On (validation)',
    sourceType: 'Product_Rule',
    sourceCode: `Product Rule: "Block_Starter_With_Enterprise_AddOn"
  Type: Validation
  Scope: Quote
  Conditions: Product.Family = "Starter"
  Error Condition:
    Tested Object:  Quote Line
    Tested Field:   Product.Family
    Operator:       Equals
    Filter Value:   "Enterprise Add-On"
  Error Message: "Enterprise Add-Ons cannot be combined with Starter plans."`,
    businessPurpose:
      'Blocks quotes that contain both a Starter plan line and an Enterprise Add-On line, surfacing an explanatory error message.',
    usageSignal: 'Confirmed_Usage',
    complexityScore: 24,
    dependencies: [
      { type: 'field', name: 'Product.Family', reference: 'Product2.Family' },
    ],
    recommendedRcaTarget: 'CML_Constraint',
    conversionConfidence: 'High',
    draft: {
      generatedCandidate: `type StarterPlan : LineItem {
    constraint noEnterpriseAddOn {
        description: "Enterprise Add-Ons cannot be combined with Starter plans."
        enforcement: Error
        condition: NOT exists(sibling where type == EnterpriseAddOn)
    }
}

type EnterpriseAddOn : LineItem {
    // marker type — no additional constraints
}`,
      candidateLanguage: 'cml',
      plainLanguageExplanation:
        'CML constraint enforces the same incompatibility at sub-second solve time, evaluated during configuration rather than at quote save.',
      targetPatternReasoning:
        'Validation product rule maps directly to a CML constraint with `enforcement: Error` per KB §3.3. CML is the configuration-engine target; pricing rules stay in Pricing Procedures.',
      preservedBehavior: [
        'Starter plan + Enterprise Add-On combination is blocked.',
        'Same error message shown to the rep.',
      ],
      changedBehavior: [
        'Constraint evaluates during interactive configuration rather than only at save time.',
      ],
      unknowns: ['Whether other plan tiers should have analogous constraints.'],
      requiredTests: [
        'Adding an Enterprise Add-On to a Starter plan triggers the error.',
        'Removing the Starter plan resolves the error.',
        'Constraint solves in < 1s on a 50-line quote.',
      ],
      humanReviewRequired: false,
      reviewReasons: [],
    },
    evidence: ev(
      [
        'Validation rule with a single forbidden combination.',
        'Maps cleanly to a CML constraint with Error enforcement.',
      ],
      [
        { metric: 'Conditions', value: 1, source: 'Product rule definition' },
        { metric: 'Error conditions', value: 1, source: 'Product rule definition' },
      ],
      ['Block_Starter_With_Enterprise_AddOn'],
    ),
  },
  {
    id: 'pdr-002',
    name: 'Auto-include support with platform license',
    sourceType: 'Product_Rule',
    sourceCode: `Product Rule: "Auto_Add_Support_With_Platform"
  Type: Selection
  Scope: Product
  Conditions: Product = "Platform License"
  Action: Add
  Action Product: "Basic Support"
  Action Quantity: 1`,
    businessPurpose:
      'Automatically adds a Basic Support line whenever a Platform License is added to a quote.',
    usageSignal: 'Confirmed_Usage',
    complexityScore: 22,
    dependencies: [
      { type: 'object', name: 'Platform License', reference: 'Product2[Platform License]' },
      { type: 'object', name: 'Basic Support', reference: 'Product2[Basic Support]' },
    ],
    recommendedRcaTarget: 'CML_Relationship',
    conversionConfidence: 'High',
    draft: {
      generatedCandidate: `type PlatformLicense : LineItem {
    relation support : BasicSupport[1..1] {
        default BasicSupport(1);
        constraint alwaysPresent {
            description: "Basic Support is mandatory with Platform License"
            enforcement: Error
            condition: count(support) >= 1
        }
    }
}`,
      candidateLanguage: 'cml',
      plainLanguageExplanation:
        'In CML the relationship IS the rule. The 1..1 cardinality enforces inclusion and the default clause auto-populates the support line.',
      targetPatternReasoning:
        'Selection product rule → CML Relationship with cardinality + default per KB §3.4. Configuration logic, not pricing.',
      preservedBehavior: [
        'Adding Platform License auto-includes Basic Support (qty 1).',
      ],
      changedBehavior: [
        'Removing Basic Support is now blocked at configuration time, not save time.',
      ],
      unknowns: ['Whether Premium Support should be substitutable for Basic Support.'],
      requiredTests: [
        'Add Platform License → Basic Support appears automatically.',
        'Attempt to remove auto-included Basic Support → blocked with explanation.',
      ],
      humanReviewRequired: false,
      reviewReasons: [],
    },
    evidence: ev(
      [
        'Selection rule with single trigger product and single action product.',
        'Direct fit for a CML Relationship with default + 1..1 cardinality.',
      ],
      [
        { metric: 'Action quantity', value: 1, source: 'Product rule definition' },
      ],
      ['Auto_Add_Support_With_Platform'],
    ),
  },
  {
    id: 'pdr-003',
    name: 'Region-restricted product filter',
    sourceType: 'Product_Rule',
    sourceCode: `Product Rule: "Filter_Region_Restricted_Products"
  Type: Filter
  Scope: Product
  Conditions:
    - Account.BillingCountry IN ("US", "CA", "MX")
  Filter:
    - Hide Product where Product.Restricted_Regions__c includes Account.BillingCountry`,
    businessPurpose:
      'Hides region-restricted products from the catalog when the account is billed in a country listed on the product\'s restricted-region list.',
    usageSignal: 'Active_Or_Referenced',
    complexityScore: 31,
    dependencies: [
      { type: 'field', name: 'Account.BillingCountry', reference: 'Account.BillingCountry' },
      { type: 'field', name: 'Product.Restricted_Regions__c', reference: 'Product2' },
    ],
    recommendedRcaTarget: 'Declarative_Configuration',
    conversionConfidence: 'Medium',
    draft: {
      generatedCandidate: `// RCA Product Discovery — eligibility rule
ProductDiscoveryQualification: "Q_RegionEligibility"
  Inputs:  Account.BillingCountry, Product.Restricted_Regions
  Outputs: IsEligible (Boolean)
  Rule:    IsEligible = NOT contains(Restricted_Regions, BillingCountry)
  Effect:  Excluded products do not surface in search / faceted browse.`,
      candidateLanguage: 'pseudocode',
      plainLanguageExplanation:
        'Region restriction becomes a Product Discovery qualification rule. Excluded products are filtered out of search and guided selection.',
      targetPatternReasoning:
        'Filter product rule → Product Discovery qualification per KB §2.1 / §3.3. Confidence Medium because the org may have additional implicit eligibility logic that needs surfacing during discovery.',
      preservedBehavior: [
        'Restricted products do not appear for accounts in the listed countries.',
      ],
      changedBehavior: [
        'Filtering happens at discovery time, not at line addition.',
      ],
      unknowns: [
        'Whether other geo-related restrictions exist (state-level, EU sub-regions).',
      ],
      requiredTests: [
        'US-billed account does not see US-restricted products.',
        'CA-billed account sees products restricted only to MX.',
        'Search and guided selection both honor the rule.',
      ],
      humanReviewRequired: false,
      reviewReasons: [],
    },
    evidence: ev(
      [
        'Filter rule keyed on country + restricted-regions field.',
        'Touches three countries today.',
        'Native fit for Product Discovery qualification.',
      ],
      [
        { metric: 'Countries scoped', value: 3, source: 'Product rule definition' },
      ],
      ['Filter_Region_Restricted_Products'],
    ),
  },

  // ---------- Discount schedules (2) ----------
  {
    id: 'ds-001',
    name: 'Standard volume discount tiers',
    sourceType: 'Discount_Schedule',
    sourceCode: `Discount Schedule: "Volume_Discount_Tiers"
  Type: Range
  Tier 1: 1-9    units → 0%
  Tier 2: 10-49  units → 5%
  Tier 3: 50-99  units → 10%
  Tier 4: 100+   units → 15%`,
    businessPurpose:
      'Applies volume-based percentage discounts using a four-tier Range schedule.',
    usageSignal: 'Confirmed_Usage',
    complexityScore: 18,
    dependencies: [],
    recommendedRcaTarget: 'Price_Adjustment_Method',
    conversionConfidence: 'High',
    draft: {
      generatedCandidate: `PriceAdjustmentSchedule:
  Name:             "Volume_Discount_Tiers"
  AdjustmentMethod: Range
  Type:             Volume

PriceAdjustmentTier rows:
  | LowerBound | UpperBound | AdjustmentValue | AdjustmentType |
  | 1          | 9          | 0               | Percentage     |
  | 10         | 49         | 5               | Percentage     |
  | 50         | 99         | 10              | Percentage     |
  | 100        | null       | 15              | Percentage     |`,
      candidateLanguage: 'json',
      plainLanguageExplanation:
        'Direct mapping to a PriceAdjustmentSchedule with four PriceAdjustmentTier rows using the Range adjustment method.',
      targetPatternReasoning:
        'KB §3.5: CPQ Discount Schedule (Range) → PriceAdjustmentSchedule + PriceAdjustmentTier with AdjustmentMethod = Range. One-to-one structural mapping.',
      preservedBehavior: [
        'All four tiers and their thresholds preserved.',
        'Range method (one tier applies to all units) preserved.',
      ],
      changedBehavior: [
        'Schedule can now be Slab (per-tier) instead of Range with a single configuration change.',
      ],
      unknowns: [],
      requiredTests: [
        'Quantity 9 receives 0% discount.',
        'Quantity 50 receives 10% across all units (Range behavior).',
        'Quantity 100 receives 15%.',
      ],
      humanReviewRequired: false,
      reviewReasons: [],
    },
    evidence: ev(
      [
        'Standard 4-tier volume discount.',
        'Range adjustment method.',
        'Direct fit for PriceAdjustmentSchedule.',
      ],
      [
        { metric: 'Tiers', value: 4, source: 'Discount schedule definition' },
        { metric: 'Adjustment method', value: 'Range', source: 'Discount schedule definition' },
      ],
      ['Volume_Discount_Tiers'],
    ),
  },
  {
    id: 'ds-002',
    name: 'Term-based graduated discount (Slab)',
    sourceType: 'Discount_Schedule',
    sourceCode: `Discount Schedule: "Term_Graduated_Discount"
  Type: Range  (CPQ does not support Slab natively — emulated via QCP today)
  Tier 1: 1-12   months → 0%
  Tier 2: 13-24  months → 4%
  Tier 3: 25-36  months → 8%
  Tier 4: 37+    months → 12%`,
    businessPurpose:
      'Applies a graduated (per-tier) discount based on subscription term length, currently emulated in QCP because CPQ only supports Range.',
    usageSignal: 'Confirmed_Usage',
    complexityScore: 36,
    dependencies: [
      { type: 'field', name: 'QuoteLine.SubscriptionTerm', reference: 'SBQQ__QuoteLine__c' },
    ],
    recommendedRcaTarget: 'Price_Adjustment_Method',
    conversionConfidence: 'High',
    draft: {
      generatedCandidate: `PriceAdjustmentSchedule:
  Name:             "Term_Graduated_Discount"
  AdjustmentMethod: Slab          // RCA-native, no QCP emulation needed
  Type:             Term

PriceAdjustmentTier rows:
  | LowerBound | UpperBound | AdjustmentValue | AdjustmentType |
  | 1          | 12         | 0               | Percentage     |
  | 13         | 24         | 4               | Percentage     |
  | 25         | 36         | 8               | Percentage     |
  | 37         | null       | 12              | Percentage     |`,
      candidateLanguage: 'json',
      plainLanguageExplanation:
        'RCA supports Slab natively (KB §3.5). The QCP emulation that exists today can be deleted; the schedule is expressed purely in PriceAdjustmentSchedule + PriceAdjustmentTier with AdjustmentMethod = Slab.',
      targetPatternReasoning:
        'KB §3.5: RCA supports Slab adjustment method natively. Replaces the current Range-plus-QCP emulation with a clean declarative schedule.',
      preservedBehavior: [
        'Per-tier graduated discount preserved.',
        'Same percentage at each tier.',
      ],
      changedBehavior: [
        'No QCP code required to emulate Slab behavior — net deletion of pricing JS.',
      ],
      unknowns: [],
      requiredTests: [
        '24-month term: months 1–12 at 0%, months 13–24 at 4% (per-tier).',
        '36-month term: split across three tier rates.',
        'Total reconciles to QCP-emulated value within rounding.',
      ],
      humanReviewRequired: false,
      reviewReasons: [],
    },
    evidence: ev(
      [
        'Currently emulated with a QCP because CPQ only supports Range.',
        'RCA Slab adjustment method removes the need for emulation entirely.',
      ],
      [
        { metric: 'Tiers', value: 4, source: 'Discount schedule definition' },
        { metric: 'Adjustment method (target)', value: 'Slab', source: 'KB §3.5' },
      ],
      ['Term_Graduated_Discount', 'QuoteCalculatorPlugin.js'],
    ),
  },

  // ---------- Summary variables (2) ----------
  {
    id: 'sv-001',
    name: 'Total discount across lines (summary variable)',
    sourceType: 'Summary_Variable',
    sourceCode: `Summary Variable: "Total_Discount_Across_All_Lines"
  Aggregate Function: SUM
  Target Object:      Quote Line
  Target Field:       SBQQ__Discount__c
  Filter:             Active = true
Validation Rule reference:
  Total_Discount_Across_All_Lines <= 30`,
    businessPurpose:
      'Sums Discount across all active quote lines and feeds a validation rule that caps total discount at 30%.',
    usageSignal: 'Confirmed_Usage',
    complexityScore: 30,
    dependencies: [
      { type: 'field', name: 'QuoteLine.SBQQ__Discount__c', reference: 'SBQQ__QuoteLine__c' },
    ],
    recommendedRcaTarget: 'Apex_Invocable_Extension',
    conversionConfidence: 'Medium',
    draft: {
      generatedCandidate: `// RCA: cross-line aggregation requires a custom Apex Invocable Action (KB §3.7).
public class TotalDiscountValidator {
    @InvocableMethod(label='Validate total discount cap')
    public static List<ValidationResult> validate(List<Id> quoteIds) {
        List<ValidationResult> out = new List<ValidationResult>();
        for (Id qId : quoteIds) {
            Decimal total = 0;
            for (QuoteLineItem qli : [
                SELECT Discount FROM QuoteLineItem WHERE QuoteId = :qId
            ]) {
                total += (qli.Discount != null ? qli.Discount : 0);
            }
            ValidationResult r = new ValidationResult();
            r.isValid = total <= 30;
            r.message = r.isValid ? '' : 'Total discount exceeds 30% cap.';
            out.add(r);
        }
        return out;
    }
    public class ValidationResult { @InvocableVariable public Boolean isValid; @InvocableVariable public String message; }
}`,
      candidateLanguage: 'apex',
      plainLanguageExplanation:
        'Cross-line summed discount with a hard cap. Implemented as an Apex Invocable Action called from the validation flow because RCA has no declarative equivalent for arbitrary cross-line aggregation (KB §3.7).',
      targetPatternReasoning:
        'KB §3.7 Quick Reference: simple-aggregation summary variables can use BRE Expression Set with SUM; capped-aggregation with branching message logic is best expressed as an Apex Invocable Action.',
      preservedBehavior: [
        '30% total-discount cap enforced.',
        'Same error message returned on violation.',
      ],
      changedBehavior: [
        'Aggregation runs against QuoteLineItem instead of SBQQ__QuoteLine__c.',
      ],
      unknowns: [
        'Whether the cap is global or varies by deal type / segment.',
      ],
      requiredTests: [
        'Quote summing to 30% passes; 31% fails.',
        'Inactive lines (if modelled) do not contribute.',
      ],
      humanReviewRequired: false,
      reviewReasons: [],
    },
    evidence: ev(
      [
        'Summed Discount across active quote lines.',
        'Hard 30% cap enforced via validation rule.',
      ],
      [
        { metric: 'Aggregation function', value: 'SUM', source: 'Summary variable definition' },
        { metric: 'Cap (%)', value: 30, source: 'Validation rule' },
      ],
      ['Total_Discount_Across_All_Lines'],
    ),
  },
  {
    id: 'sv-002',
    name: 'Aggregate quantity by product family (summary variable)',
    sourceType: 'Summary_Variable',
    sourceCode: `Summary Variable: "Qty_By_Family_Software"
  Aggregate Function: SUM
  Target Object:      Quote Line
  Target Field:       Quantity
  Filter:             Product.Family = "Software"`,
    businessPurpose:
      'Sums Quantity across all quote lines whose Product.Family is "Software"; feeds a downstream price rule for software-tier discounts.',
    usageSignal: 'Confirmed_Usage',
    complexityScore: 24,
    dependencies: [
      { type: 'field', name: 'QuoteLine.Quantity', reference: 'SBQQ__QuoteLine__c' },
      { type: 'field', name: 'Product.Family', reference: 'Product2.Family' },
    ],
    recommendedRcaTarget: 'Pricing_Procedure',
    conversionConfidence: 'High',
    draft: {
      generatedCandidate: `// BRE Expression Set with native SUM — no Apex required.
ExpressionSet: ES_QtyByFamilySoftware
  Inputs:   QuoteLineItems[*].Product.Family, QuoteLineItems[*].Quantity
  Output:   QtyByFamily_Software (Decimal)
  Function: SUM(QuoteLineItems[*].Quantity WHERE Product.Family == "Software")
Used by:    Pricing Procedure step "SoftwareTierDiscount"`,
      candidateLanguage: 'pseudocode',
      plainLanguageExplanation:
        'Simple aggregation by family — implemented as a BRE Expression Set with native SUM (KB §3.7 Quick Reference: simple summary variables can be declarative).',
      targetPatternReasoning:
        'KB §3.7 Quick Reference: a Summary Variable doing simple aggregation maps to a BRE Expression Set with SUM. Implemented as a Pricing Procedure step (Expression Set) — no Apex.',
      preservedBehavior: [
        'Same quantity sum for the Software family.',
      ],
      changedBehavior: [
        'Aggregation is computed inline within the pricing procedure rather than a separate summary variable artifact.',
      ],
      unknowns: [
        'Whether other family-scoped aggregations exist that should follow the same pattern.',
      ],
      requiredTests: [
        'Three Software lines with quantities 5/10/15 yield aggregate 30.',
        'Non-Software lines excluded from the sum.',
      ],
      humanReviewRequired: false,
      reviewReasons: [],
    },
    evidence: ev(
      [
        'Single-family quantity aggregation.',
        'Direct fit for BRE Expression Set with SUM.',
      ],
      [
        { metric: 'Family scope', value: 'Software', source: 'Summary variable filter' },
      ],
      ['Qty_By_Family_Software'],
    ),
  },
];

// ---------------------------------------------------------------------------
// Top concerns
// ---------------------------------------------------------------------------

const topConcerns: Concern[] = [
  {
    id: 'concern-pricing-translation',
    title: 'Pricing logic translation risk',
    severity: 'High' satisfies Severity,
    audienceFraming: {
      executive: {
        headline: 'Pricing logic is the migration\'s critical path.',
        impact:
          '7 QCP scripts and Apex pricing currently determine quote totals. Translation errors land in invoices.',
        nextAction:
          'Schedule a pricing-focused validation workshop with the CPQ admin and the AllCloud delivery lead before SOW commitment.',
      },
      sales: {
        headline: 'Open the discovery call by aligning on pricing intent before pricing implementation.',
        sowCaveat:
          'Pricing procedure design assumes validated pricing logic intent — variance triggers a change order.',
        talkingPoint:
          '"Your pricing today runs in the browser via QCP plus a few Apex pieces. RCA moves it server-side and gives you a price waterfall. The migration cost is mostly in validating intent, not writing code."',
      },
      salesforce: {
        headline: 'Pricing translation is the single biggest implementation risk on this account.',
        migrationRisk:
          'QCP and pricing Apex must be replaced by Pricing Procedures + BRE Decision Tables. KB §5.2 / P5 (Decision Table refresh) is the most common post-go-live bug; allocate UAT cycles accordingly.',
      },
    },
    evidence: ev(
      [
        '7 QCP scripts touch every recalc.',
        '3 quote-calculation Apex dependencies (cost-plus trigger, weighted-discount validator, recursive proration).',
        'External tax callout is on the pricing path with no fallback contract.',
      ],
      [
        { metric: 'QCP scripts (org-wide)', value: 7, source: 'Org scan' },
        { metric: 'Quote-calc Apex dependencies', value: 3, source: 'Static analysis' },
        { metric: 'Price rules (org-wide)', value: 42, source: 'Org scan' },
      ],
      ['q-001', 'q-002', 'q-003', 'q-004', 'q-005', 'a-001', 'a-002'],
    ),
  },
  {
    id: 'concern-amendment-complexity',
    title: 'Custom amendment logic complexity',
    severity: 'High' satisfies Severity,
    audienceFraming: {
      executive: {
        headline: 'A bespoke amendment service exists where RCA would use a single platform action.',
        impact:
          '~140 lines of Apex handle proration, co-termination, and credit logic. Most of this is replaceable.',
        nextAction:
          'Walk the amendment paths with finance to confirm the platform\'s native lifecycle covers every commercial case.',
      },
      sales: {
        headline: 'A high-value win story: replace a 140-line bespoke service with a single declarative action.',
        sowCaveat:
          'Amendment migration assumes finance signs off on the asset-centric proration model; non-standard scenarios may require an Apex thin wrapper.',
        talkingPoint:
          '"Your amendment Apex is one of the clearest wins in this migration. Native Initiate Amendment handles proration, co-term, and credit memos — your team gets out of the maintenance business."',
      },
      salesforce: {
        headline: 'Custom amendment Apex blocks adoption of native asset lifecycle features.',
        migrationRisk:
          'Migration plan must front-load asset modelling (AssetAction + AssetStatePeriod) before retiring CPQ_AmendmentService — KB §5.4 / P13.',
      },
    },
    evidence: ev(
      [
        '140 lines of Apex perform amendment proration and co-termination.',
        'Touches subscription cloning, credit lines, and bespoke proration math.',
        'Native fit for the Initiate Amendment lifecycle action.',
      ],
      [
        { metric: 'Lines of Apex (amendment service)', value: 140, source: 'CPQ_AmendmentService.cls' },
        { metric: 'Active contracts impacted', value: 1200, source: 'Org data volume' },
      ],
      ['a-003'],
    ),
  },
  {
    id: 'concern-legacy-provisioning',
    title: 'Legacy provisioning integration',
    severity: 'Medium' satisfies Severity,
    audienceFraming: {
      executive: {
        headline: 'A legacy in-house provisioning system has no documented API contract.',
        impact:
          'Order activation depends on this integration; the contract gap is a delivery risk.',
        nextAction: 'Request the legacy system\'s integration contract or schedule a discovery session with that team.',
      },
      sales: {
        headline: 'Discovery prompt: how is order activation handed off today?',
        sowCaveat:
          'Legacy provisioning integration scoped pending API documentation review.',
        talkingPoint:
          '"You currently push to a legacy provisioning system after order activation. RCA\'s DRO can orchestrate that handoff with retry, jeopardy, and audit — once we understand the API contract."',
      },
      salesforce: {
        headline: 'DRO is a strong fit but blocked on the legacy system\'s contract.',
        migrationRisk:
          'Without the API contract, DRO scoping is speculative. Plan a discovery session before SOW.',
      },
    },
    evidence: ev(
      [
        'Outbound integration to a legacy in-house provisioning system.',
        'No documented API contract on file.',
        'Direct match for KB §4.1 DRO trigger conditions.',
      ],
      [
        { metric: 'Integrations (org-wide)', value: 4, source: 'Org scan' },
        { metric: 'Documented API contracts', value: 3, source: 'Org scan' },
      ],
      [],
    ),
  },
  {
    id: 'concern-summary-variables',
    title: 'Summary variable dependencies',
    severity: 'Medium' satisfies Severity,
    audienceFraming: {
      executive: {
        headline: 'Cross-line aggregation logic does not have a declarative analogue for the complex cases.',
        impact:
          '12 summary variables touch validation and pricing. About a third require Apex invocables in RCA.',
        nextAction:
          'Audit the 12 summary variables; confirm which are simple SUMs (declarative) versus weighted/cross-line logic (Apex required).',
      },
      sales: {
        headline: 'Most summary variables migrate cleanly; a few will retain Apex.',
        sowCaveat:
          'Summary variable migration scoped per declarative-vs-Apex split confirmed in discovery.',
        talkingPoint:
          '"Your summary variables won\'t all be declarative — that\'s expected. The win is that the Apex you keep is a few invocables, not embedded calculation logic spread across the org."',
      },
      salesforce: {
        headline: 'Plan for residual Apex invocables — KB §3.7 confirms cross-line aggregation has no declarative equivalent.',
        migrationRisk:
          'Estimating LOE for the 12 summary variables requires confirming which are simple SUMs vs weighted/cross-line.',
      },
    },
    evidence: ev(
      [
        '12 summary variables in the org.',
        'Cross-line aggregation (KB §3.7) requires Apex invocables.',
        'Simple aggregation maps to BRE Expression Set with SUM.',
      ],
      [
        { metric: 'Summary variables (org-wide)', value: 12, source: 'Org scan' },
        { metric: 'Estimated requiring Apex', value: 4, source: 'Heuristic split' },
      ],
      ['sv-001', 'sv-002'],
    ),
  },
  {
    id: 'concern-deprecated-cleanup',
    title: 'Deprecated product and rule cleanup',
    severity: 'Low' satisfies Severity,
    audienceFraming: {
      executive: {
        headline: 'Inactive products and orphaned rules should be cleared before migration.',
        impact:
          'Migrating debris into RCA creates configuration conflicts and wastes effort.',
        nextAction:
          'Run a pre-migration audit; freeze cleanup decisions before Foundation Setup begins.',
      },
      sales: {
        headline: 'Pre-migration audit is a quick win — and a defensible time savings story.',
        sowCaveat:
          'Discovery includes a deprecated-config audit; cleanup work itself is scoped separately.',
        talkingPoint:
          '"Most CPQ orgs accumulate ghost products and zombie rules over years. Cleaning them up before migration is the single cheapest step in the project."',
      },
      salesforce: {
        headline: 'Standard hygiene step per KB §5.1 / P3.',
        migrationRisk:
          '47 inactive products and 18 orphaned price rules in scope for the audit.',
      },
    },
    evidence: ev(
      [
        '47 inactive products in the catalog.',
        '18 orphaned price rules with no active references.',
        'KB §5.1 / P3 calls this out as the most common pre-migration hygiene item.',
      ],
      [
        { metric: 'Inactive products', value: 47, source: 'Org scan' },
        { metric: 'Orphaned price rules', value: 18, source: 'Org scan' },
      ],
      [],
    ),
  },
];

// ---------------------------------------------------------------------------
// Expansion signals (KB §4)
// ---------------------------------------------------------------------------

const expansionSignals: ExpansionSignal[] = [
  {
    module: 'DRO',
    triggerCondition: 'Outbound integration to legacy provisioning system; manual handoff after order activation.',
    consultativeFraming:
      'DRO may be relevant if the team currently tracks fulfillment handoff manually after the order is placed.',
    confidence: 'High' satisfies ConfidenceLevel,
    evidence: ev(
      [
        'Legacy in-house provisioning integration is outbound.',
        'No documented API contract — typical of pre-DRO manual handoffs.',
        'KB §4.1 trigger condition matches.',
      ],
      [
        { metric: 'Outbound integrations', value: 4, source: 'Org scan' },
        { metric: 'Manual handoff systems', value: 1, source: 'Org scan' },
      ],
      ['concern-legacy-provisioning'],
    ),
  },
  {
    module: 'Billing',
    triggerCondition: 'Stripe integration is outbound only; no native invoice generation in Salesforce.',
    consultativeFraming:
      'RCA Billing may be relevant if the finance team is reconciling Stripe payments back into Salesforce manually today.',
    confidence: 'Medium' satisfies ConfidenceLevel,
    evidence: ev(
      [
        'Stripe payment integration is outbound only.',
        'No invoice records present in the org.',
        'KB §4.2 trigger condition matches.',
      ],
      [
        { metric: 'Stripe direction', value: 'outbound', source: 'Org scan' },
        { metric: 'Invoices in org', value: 0, source: 'Org scan' },
      ],
      [],
    ),
  },
  {
    module: 'Advanced_Approvals',
    triggerCondition: 'Custom approval routing trigger with four-tier discount/amount thresholds.',
    consultativeFraming:
      'Native RCA Advanced Approvals may be relevant — replaces the existing routing trigger and the legacy CPQ Advanced Approvals managed package at no extra license cost.',
    confidence: 'High' satisfies ConfidenceLevel,
    evidence: ev(
      [
        'Quote approval routing trigger with four-tier thresholds.',
        'CPQ Advanced Approvals managed package detected.',
        'KB §4.3 trigger condition matches.',
      ],
      [
        { metric: 'Approver tiers', value: 4, source: 'Trigger source' },
        { metric: 'Managed package detected', value: 'CPQ Advanced Approvals', source: 'Org scan' },
      ],
      ['a-004'],
    ),
  },
  {
    module: 'Revenue_Recognition',
    triggerCondition: 'Multi-element subscription deals; ASC 606 not currently automated in the org.',
    consultativeFraming:
      'Revenue Recognition may be relevant if finance is currently allocating standalone selling prices in spreadsheets.',
    confidence: 'Medium' satisfies ConfidenceLevel,
    evidence: ev(
      [
        '3,600 active subscriptions; multi-element deals are the norm.',
        'No revenue schedules in the org.',
        'KB §4.5 trigger condition is plausible — finance confirmation needed.',
      ],
      [
        { metric: 'Active subscriptions', value: 3600, source: 'Org data volume' },
        { metric: 'Revenue schedules in org', value: 0, source: 'Org scan' },
      ],
      [],
    ),
  },
  {
    module: 'Agentforce',
    triggerCondition: 'Customer is on Salesforce Enterprise Edition with active CPQ; AI-driven pricing is an emerging conversation.',
    consultativeFraming:
      'Agentforce for Revenue Management is a future-state opportunity — useful to introduce, not to scope into Phase 1.',
    confidence: 'Low' satisfies ConfidenceLevel,
    evidence: ev(
      [
        'No current Agentforce footprint observed.',
        'Enterprise Edition supports Agentforce activation.',
        'KB §4.9 — early conversation appropriate, scoping not.',
      ],
      [
        { metric: 'Agentforce installed', value: 'no', source: 'Org scan' },
        { metric: 'Edition', value: 'Enterprise', source: 'Org profile' },
      ],
      [],
    ),
  },
];

// ---------------------------------------------------------------------------
// RCA opportunities (cross-linked to expansion signals where applicable)
// ---------------------------------------------------------------------------

const rcaOpportunities: RcaOpportunity[] = [
  {
    id: 'opp-pricing-waterfall',
    cpqFinding:
      'Pricing logic spread across 42 price rules, 7 QCP scripts, and a custom Apex cost-plus trigger; no auditable trail today.',
    rcaCapability: 'Pricing Procedures + Salesforce Pricing (price waterfall)',
    rcaTargetPattern: 'Pricing Procedures backed by BRE Decision Tables; price waterfall on QuoteLineDetail.',
    businessBenefit:
      'Every pricing step is visible to finance, auditable, and editable in Setup without redeployment.',
    expansionSignal: null,
    confidence: 'High' satisfies ConfidenceLevel,
    evidence: ev(
      [
        '42 price rules + 7 QCP + Apex cost-plus consolidate into Pricing Procedures.',
        'Price waterfall is a finance-level capability not present in CPQ.',
        'KB §1 + §2.1 + §3.1 confirm the pattern.',
      ],
      [
        { metric: 'Price rules', value: 42, source: 'Org scan' },
        { metric: 'QCP scripts', value: 7, source: 'Org scan' },
      ],
      ['q-001', 'a-001', 'pr-001', 'pr-002'],
    ),
  },
  {
    id: 'opp-cml-configuration',
    cpqFinding:
      '14 product rules in the org cover validation, selection, and filtering — currently a mix of CPQ rules and QCP fallbacks.',
    rcaCapability: 'Constraint Modeling Language (CML) and Product Configurator',
    rcaTargetPattern: 'CML constraints + relations; sub-second solve.',
    businessBenefit:
      'Configuration constraints evaluated during interactive configuration, not at save time. Catalog scales to thousands of products.',
    expansionSignal: null,
    confidence: 'High' satisfies ConfidenceLevel,
    evidence: ev(
      [
        '14 product rules touch validation, selection, filtering.',
        'CML solves 10K+ line items in sub-second.',
        'KB §3.3 / §3.4 directly applicable.',
      ],
      [
        { metric: 'Product rules', value: 14, source: 'Org scan' },
      ],
      ['pdr-001', 'pdr-002', 'pdr-003'],
    ),
  },
  {
    id: 'opp-asset-lifecycle',
    cpqFinding:
      '3,600 active subscriptions and 1,200 active contracts are managed today via custom amendment Apex.',
    rcaCapability: 'Asset Lifecycle Management + Transaction Management',
    rcaTargetPattern:
      'AssetAction + AssetStatePeriod records; native Initiate Amendment / Renew / Cancel actions.',
    businessBenefit:
      'Subscription lifecycle becomes auditable and version-tracked. MRR tracked natively. Custom amendment Apex retired.',
    expansionSignal: null,
    confidence: 'High' satisfies ConfidenceLevel,
    evidence: ev(
      [
        '~140 lines of custom amendment Apex in scope for retirement.',
        '3,600 active subscriptions migrate to Asset records with AssetStatePeriod.',
        'KB §3.6 + §5.4 / P13 explicit on the migration.',
      ],
      [
        { metric: 'Active subscriptions', value: 3600, source: 'Org data volume' },
        { metric: 'Active contracts', value: 1200, source: 'Org data volume' },
      ],
      ['a-003'],
    ),
  },
  {
    id: 'opp-dro',
    cpqFinding:
      'Outbound integration to a legacy provisioning system; manual handoff after order activation.',
    rcaCapability: 'Dynamic Revenue Orchestrator (DRO)',
    rcaTargetPattern:
      'Fulfillment plan + steps + jeopardy rules orchestrating the legacy provisioning callout.',
    businessBenefit:
      'Replaces manual handoff with auditable orchestration; jeopardy rules expose SLA risk.',
    expansionSignal: 'DRO',
    confidence: 'Medium' satisfies ConfidenceLevel,
    evidence: ev(
      [
        'Legacy provisioning is outbound with no documented API contract.',
        'KB §4.1 trigger condition matches.',
        'Confidence Medium pending API contract review.',
      ],
      [
        { metric: 'Outbound integrations', value: 4, source: 'Org scan' },
      ],
      ['concern-legacy-provisioning'],
    ),
  },
  {
    id: 'opp-billing',
    cpqFinding:
      'Stripe payment integration is outbound only; invoices generated externally and reconciled manually.',
    rcaCapability: 'Revenue Cloud Billing',
    rcaTargetPattern:
      'Native BillingSchedule + BillingTreatment; Invoice records in Salesforce; CreditMemo for adjustments.',
    businessBenefit:
      'Invoice generation, payment processing, and reconciliation move into Salesforce. Eliminates spreadsheet reconciliation.',
    expansionSignal: 'Billing',
    confidence: 'Medium' satisfies ConfidenceLevel,
    evidence: ev(
      [
        'Stripe is outbound only.',
        'No Invoice records currently in the org.',
        'KB §4.2 trigger condition matches.',
      ],
      [
        { metric: 'Invoices in org', value: 0, source: 'Org scan' },
      ],
      [],
    ),
  },
  {
    id: 'opp-advanced-approvals',
    cpqFinding:
      'Quote approval routing implemented as a custom Apex trigger; CPQ Advanced Approvals managed package present.',
    rcaCapability: 'Advanced Approvals (native, no extra license)',
    rcaTargetPattern: 'ApprovalSubmission + ApprovalWorkItem with declarative routing rules.',
    businessBenefit:
      'Replaces a custom trigger and a paid managed package with a native, declarative workflow at no additional cost.',
    expansionSignal: 'Advanced_Approvals',
    confidence: 'High' satisfies ConfidenceLevel,
    evidence: ev(
      [
        'CPQ approval routing trigger present (4-tier).',
        'CPQ Advanced Approvals managed package detected.',
        'KB §2.1 + §4.3 confirm the migration.',
      ],
      [
        { metric: 'Approver tiers', value: 4, source: 'Trigger source' },
      ],
      ['a-004'],
    ),
  },
  {
    id: 'opp-revenue-rec',
    cpqFinding:
      'Multi-element deals across 3,600 subscriptions; revenue allocation handled in spreadsheets per finance.',
    rcaCapability: 'Revenue Recognition',
    rcaTargetPattern: 'RevenueSchedule + RevenueTreatment + RevenueDistribution; ASC 606 / IFRS 15 compliant.',
    businessBenefit:
      'Automated revenue scheduling; eliminates spreadsheet reconciliation; audit-ready.',
    expansionSignal: 'Revenue_Recognition',
    confidence: 'Medium' satisfies ConfidenceLevel,
    evidence: ev(
      [
        '3,600 active subscriptions; multi-element typical.',
        'No revenue schedules currently in the org.',
        'KB §4.5 trigger condition is plausible; finance to confirm.',
      ],
      [
        { metric: 'Active subscriptions', value: 3600, source: 'Org data volume' },
      ],
      [],
    ),
  },
  {
    id: 'opp-agentforce',
    cpqFinding:
      'Customer is on Enterprise Edition; no current AI/Agentforce footprint observed.',
    rcaCapability: 'Agentforce for Revenue Management',
    rcaTargetPattern: 'Pre-built topics for pricing intelligence, contract analysis, anomaly detection.',
    businessBenefit:
      'Future-state intelligence for deal scoring and pricing recommendations — best introduced after a stable RCA foundation.',
    expansionSignal: 'Agentforce',
    confidence: 'Low' satisfies ConfidenceLevel,
    evidence: ev(
      [
        'No Agentforce footprint detected.',
        'Enterprise Edition supports activation.',
        'KB §4.9 trigger condition partial; budget conversation needed.',
      ],
      [
        { metric: 'Agentforce installed', value: 'no', source: 'Org scan' },
      ],
      [],
    ),
  },
];

// ---------------------------------------------------------------------------
// rcaBenefitMapping — 10 entries
// ---------------------------------------------------------------------------

const rcaBenefitMapping: BenefitMappingEntry[] = [
  {
    cpqPainPoint: 'QCP-driven pricing has no audit trail.',
    rcaCapability: 'Salesforce Pricing — price waterfall',
    businessBenefit: 'Every pricing step is visible to finance and reviewable per quote.',
    salesforceExpansion: null,
    confidence: 'High',
    evidence: ev(
      ['7 QCP scripts in scope.', 'Price waterfall is a native RCA artifact.'],
      [{ metric: 'QCP scripts', value: 7, source: 'Org scan' }],
      ['opp-pricing-waterfall'],
    ),
  },
  {
    cpqPainPoint: 'Custom Apex cost-plus trigger for margin pricing.',
    rcaCapability: 'Pricing Procedure with Cost Book',
    businessBenefit: 'No Apex; cost source is a standard CostBookEntry, configurable per environment.',
    salesforceExpansion: null,
    confidence: 'High',
    evidence: ev(
      ['Cost-plus pricing is a Pricing Procedure target.', 'KB §3.2 explicit.'],
      [],
      ['a-001'],
    ),
  },
  {
    cpqPainPoint: 'Bespoke amendment Apex (proration, co-term, credit memos).',
    rcaCapability: 'Asset Lifecycle Management + Initiate Amendment',
    businessBenefit: 'Native lifecycle replaces ~140 lines of Apex; AssetAction + AssetStatePeriod give an audit trail.',
    salesforceExpansion: null,
    confidence: 'High',
    evidence: ev(
      ['140 lines of amendment Apex in scope.', 'KB §3.6 explicit.'],
      [{ metric: 'Lines of Apex retired', value: 140, source: 'CPQ_AmendmentService.cls' }],
      ['a-003'],
    ),
  },
  {
    cpqPainPoint: 'Configuration rules spread across product rules and QCP fallbacks.',
    rcaCapability: 'CML Constraints + Product Configurator',
    businessBenefit: 'Constraint enforcement during configuration, not at save time; sub-second solve at scale.',
    salesforceExpansion: null,
    confidence: 'High',
    evidence: ev(
      ['14 product rules in scope.', 'CML solves 10K+ line items in sub-second.'],
      [{ metric: 'Product rules', value: 14, source: 'Org scan' }],
      ['pdr-001', 'pdr-002'],
    ),
  },
  {
    cpqPainPoint: 'Slab pricing emulated in QCP because CPQ only supports Range.',
    rcaCapability: 'PriceAdjustmentSchedule with Slab adjustment method',
    businessBenefit: 'QCP emulation deleted; Slab supported natively.',
    salesforceExpansion: null,
    confidence: 'High',
    evidence: ev(
      ['Term-based graduated discount currently emulated in QCP.', 'KB §3.5 confirms native Slab support.'],
      [],
      ['ds-002'],
    ),
  },
  {
    cpqPainPoint: 'Manual handoff to legacy provisioning system after order activation.',
    rcaCapability: 'Dynamic Revenue Orchestrator (DRO)',
    businessBenefit: 'Auditable orchestration with retry, jeopardy, and fallout handling.',
    salesforceExpansion: 'DRO',
    confidence: 'Medium',
    evidence: ev(
      ['Legacy provisioning is outbound, undocumented.', 'KB §4.1 match.'],
      [],
      ['opp-dro', 'concern-legacy-provisioning'],
    ),
  },
  {
    cpqPainPoint: 'Stripe outbound only; manual invoice reconciliation.',
    rcaCapability: 'Revenue Cloud Billing',
    businessBenefit: 'Invoice + payment + credit memo lifecycle inside Salesforce.',
    salesforceExpansion: 'Billing',
    confidence: 'Medium',
    evidence: ev(
      ['No Invoice records in the org.', 'KB §4.2 match.'],
      [],
      ['opp-billing'],
    ),
  },
  {
    cpqPainPoint: 'Custom approval routing trigger plus paid managed package.',
    rcaCapability: 'Advanced Approvals (native, no license)',
    businessBenefit: 'Declarative routing rules at no extra license cost; trigger retired.',
    salesforceExpansion: 'Advanced_Approvals',
    confidence: 'High',
    evidence: ev(
      ['4-tier approval routing trigger.', 'CPQ Advanced Approvals managed package detected.'],
      [{ metric: 'Approver tiers', value: 4, source: 'Trigger source' }],
      ['a-004', 'opp-advanced-approvals'],
    ),
  },
  {
    cpqPainPoint: 'Cross-line discount caps enforced by Apex aggregations.',
    rcaCapability: 'BRE Expression Sets + Apex Invocable hooks',
    businessBenefit: 'Simple aggregations declarative; cross-line caps remain Apex but isolated as invocables.',
    salesforceExpansion: null,
    confidence: 'Medium',
    evidence: ev(
      ['12 summary variables in scope.', 'KB §3.7 split between declarative and Apex paths.'],
      [{ metric: 'Summary variables', value: 12, source: 'Org scan' }],
      ['sv-001', 'sv-002', 'a-002'],
    ),
  },
  {
    cpqPainPoint: 'Multi-element revenue allocation handled in spreadsheets.',
    rcaCapability: 'Revenue Recognition',
    businessBenefit: 'Automated ASC 606 / IFRS 15 schedules; eliminates spreadsheet reconciliation.',
    salesforceExpansion: 'Revenue_Recognition',
    confidence: 'Medium',
    evidence: ev(
      ['3,600 active subscriptions.', 'No revenue schedules in the org.'],
      [{ metric: 'Active subscriptions', value: 3600, source: 'Org data volume' }],
      ['opp-revenue-rec'],
    ),
  },
];

// ---------------------------------------------------------------------------
// salesTalkingPoints — 7 across the four contexts
// ---------------------------------------------------------------------------

const salesTalkingPoints: TalkingPoint[] = [
  {
    context: 'discovery_call',
    point:
      'Lead with pricing intent before pricing implementation. Validate the why behind the 7 QCP scripts and the cost-plus trigger before scoping the Pricing Procedures.',
    supportingData:
      '42 price rules, 7 QCP scripts, 3 quote-calculation Apex dependencies (cost-plus trigger, weighted-discount validator, recursive proration).',
  },
  {
    context: 'discovery_call',
    point:
      'Ask explicitly about post-order handoff. The legacy provisioning system has no documented API contract — that conversation belongs in discovery, not in the SOW.',
    supportingData:
      '4 integrations: NetSuite (bidirectional), Avalara, Stripe, legacy provisioning. Only the legacy system lacks documentation.',
  },
  {
    context: 'sow_review',
    point:
      'Anchor the SOW caveat: "Pricing procedure design assumes validated pricing logic intent — variance triggers a change order." Repeat this in every SOW redline pass.',
    supportingData:
      'LOE band is 22–32 weeks at Medium confidence; the confidence cap is largely about pricing intent.',
  },
  {
    context: 'sow_review',
    point:
      'Front-load asset modelling. AssetAction + AssetStatePeriod records must exist before retiring the custom amendment Apex (KB §5.4 / P13).',
    supportingData:
      '3,600 active subscriptions, 1,200 active contracts, ~140 lines of amendment Apex in scope.',
  },
  {
    context: 'executive_meeting',
    point:
      'Frame this as a Medium-to-High complexity migration with a clear path. The verdict is Proceed With Caution: pricing translation needs validation, but the architectural bones are good.',
    supportingData:
      'Overall complexity 68/100. Pricing 75, Custom Code 72, Integrations 65 — all manageable with phased delivery.',
  },
  {
    context: 'executive_meeting',
    point:
      'The amendment Apex is the executive-friendly win story: 140 lines of custom code replaced by a single declarative lifecycle action.',
    supportingData:
      '140 lines of CPQ_AmendmentService Apex maps directly to the Initiate Amendment action (KB §3.6).',
  },
  {
    context: 'salesforce_handoff',
    point:
      'Position three expansion signals consultatively in the partner brief: DRO (high confidence), Advanced Approvals (high confidence), Billing (medium). Agentforce is a future-state intro, not Phase 1 scope.',
    supportingData:
      '5 expansion signals total; DRO + Advanced Approvals trigger conditions are explicit in the org scan.',
  },
];

// ---------------------------------------------------------------------------
// implementationFindings — 15 across 6 categories
// ---------------------------------------------------------------------------

const implementationFindings: ImplementationFinding[] = [
  // Pricing (4)
  {
    category: 'Pricing',
    severity: 'High',
    finding: 'External tax callout in QCP is on the pricing critical path with auth in a global window variable.',
    technicalDetail:
      'QuoteCalculatorPlugin.js issues a synchronous fetch per line to internal-tax.example.com using window.__taxToken. RCA migration must move auth to a Named Credential and respect pricing call-time budgets.',
    recommendedAction:
      'Convert to a Pricing Procedure Apex hook (ProcedurePlanOption.ApexClass) backed by a Named Credential. Validate latency on a 50-line quote.',
    evidence: ev(
      ['Synchronous external callout per line.', 'Auth via window.__taxToken.', '8% fallback rate hardcoded.'],
      [
        { metric: 'External endpoint', value: 'internal-tax.example.com', source: 'QCP source' },
        { metric: 'Fallback rate', value: '8%', source: 'QCP source' },
      ],
      ['q-003'],
    ),
  },
  {
    category: 'Pricing',
    severity: 'High',
    finding: 'Recursive subscription proration QCP has no declarative analogue.',
    technicalDetail:
      'Walks parent + bundled lines to depth 12, applying a day-based proration factor. Choice between native asset modelling (preferred) and an Apex invocable mirror requires finance + delivery alignment.',
    recommendedAction:
      'Schedule a design session with finance to model co-termination as AssetAction + AssetStatePeriod where possible; fall back to Apex invocable only when asset-native modelling cannot express the case.',
    evidence: ev(
      ['Recursive QCP touching dependent + bundled lines.', 'Defensive depth cap of 12.'],
      [{ metric: 'Recursion depth cap', value: 12, source: 'QCP source' }],
      ['q-005'],
    ),
  },
  {
    category: 'Pricing',
    severity: 'Medium',
    finding: 'Decision Tables backing FX adjustment require a documented refresh cadence.',
    technicalDetail:
      'KB §5.2 / P5 (Decision Table refresh after deploy) is the most common post-go-live pricing bug. The FX adjustment table must have an explicit refresh policy in CI/CD.',
    recommendedAction:
      'Define a refresh job in CI/CD; document the cadence in the SOW; add a UAT scenario that explicitly verifies post-deploy refresh.',
    evidence: ev(
      ['Multi-currency adjustment uses a lookup query today.', 'KB §5.2 / P5 explicit risk.'],
      [{ metric: 'Currencies covered', value: 4, source: 'Lookup query rows' }],
      ['pr-004'],
    ),
  },
  {
    category: 'Pricing',
    severity: 'Low',
    finding: 'Custom rounding logic is trivially portable to a Pricing Procedure final step.',
    technicalDetail:
      'NetPrice rounded to nearest 0.05. Single expression step in the pricing procedure replaces the QCP entirely.',
    recommendedAction:
      'Implement as the final step of the pricing procedure; verify multi-currency behavior follows the same rule.',
    evidence: ev(
      ['Trivial rounding QCP, 11 lines.'],
      [{ metric: 'Lines of code', value: 11, source: 'QCP source' }],
      ['q-004'],
    ),
  },

  // Configuration (3)
  {
    category: 'Configuration',
    severity: 'Medium',
    finding: 'Mix of CPQ Product Rules and QCP fallbacks for configuration logic.',
    technicalDetail:
      'Validation, selection, and filter rules cover most cases. CML migration requires choosing CML over BRE upfront (KB §5.3 / P9) and committing.',
    recommendedAction:
      'During Foundation Setup, decide CML-first; document the decision in the migration plan. Mixing CML and BRE for configuration creates ambiguity.',
    evidence: ev(
      ['14 product rules in scope.', 'KB §5.3 / P9 explicit on choosing one engine.'],
      [{ metric: 'Product rules', value: 14, source: 'Org scan' }],
      ['pdr-001', 'pdr-002', 'pdr-003'],
    ),
  },
  {
    category: 'Configuration',
    severity: 'Medium',
    finding: 'Bundle catalog has 28 active bundles; CML modelling effort proportional.',
    technicalDetail:
      'Each bundle becomes a CML type with relations and constraints. Most map cleanly; learning curve on CML is the binding constraint.',
    recommendedAction:
      'Allocate dedicated CML training time during Foundation Setup (KB §5.3 / P10).',
    evidence: ev(
      ['28 active bundles.', '340 products total.'],
      [
        { metric: 'Active bundles', value: 28, source: 'Org scan' },
        { metric: 'Products', value: 340, source: 'Org data volume' },
      ],
      [],
    ),
  },
  {
    category: 'Configuration',
    severity: 'Low',
    finding: 'Region restriction filter is a clean fit for Product Discovery qualification.',
    technicalDetail:
      'Three countries scoped today. Migrating to Product Discovery makes the rule visible in search and guided selection.',
    recommendedAction: 'Implement during Migration Build; add UAT scenarios for each scoped country.',
    evidence: ev(
      ['Filter rule with three-country scope.', 'KB §3.3 explicit fit.'],
      [{ metric: 'Countries scoped', value: 3, source: 'Product rule definition' }],
      ['pdr-003'],
    ),
  },

  // Custom Code (3)
  {
    category: 'Custom Code',
    severity: 'High',
    finding: 'Custom amendment service is the largest single Apex retirement opportunity.',
    technicalDetail:
      '~140 lines of CPQ_AmendmentService.cls handle proration, co-termination, and credit logic. Native Initiate Amendment action plus BillingTreatment.ProrationPolicy replace it.',
    recommendedAction:
      'Front-load asset modelling in the migration plan (KB §5.4 / P13). Confirm with finance that the asset-centric model covers every commercial case before retiring.',
    evidence: ev(
      ['140 lines of bespoke amendment Apex.', 'KB §3.6 + §5.4 explicit on the migration.'],
      [{ metric: 'Lines of Apex', value: 140, source: 'CPQ_AmendmentService.cls' }],
      ['a-003', 'concern-amendment-complexity'],
    ),
  },
  {
    category: 'Custom Code',
    severity: 'Medium',
    finding: 'Cross-line discount validators retain Apex by design.',
    technicalDetail:
      'KB §3.7 confirms cross-line aggregation has no declarative equivalent. Apex invocables are the right answer, called from Pricing Procedure or validation flows.',
    recommendedAction:
      'Plan for residual Apex invocables in the LOE; surface this clearly in the SOW so it is not perceived as a regression.',
    evidence: ev(
      ['Cross-line weighted-discount validator in scope.', '12 summary variables in scope.'],
      [{ metric: 'Summary variables', value: 12, source: 'Org scan' }],
      ['a-002', 'sv-001'],
    ),
  },
  {
    category: 'Custom Code',
    severity: 'Info',
    finding: 'Quote approval routing trigger retires entirely.',
    technicalDetail:
      'Four-tier routing maps directly to ApprovalWorkItem rules. Trigger deleted; CPQ Advanced Approvals managed package uninstalled.',
    recommendedAction: 'Schedule trigger deprecation immediately after Advanced Approvals cutover.',
    evidence: ev(
      ['4-tier routing trigger.', 'KB §4.3 explicit.'],
      [],
      ['a-004'],
    ),
  },

  // Data Migration (2)
  {
    category: 'Data Migration',
    severity: 'High',
    finding: 'Active subscriptions must migrate to Asset + AssetAction + AssetStatePeriod, not Asset alone.',
    technicalDetail:
      'KB §5.4 / P13 explicit: missing AssetStatePeriod records block Transaction Management amend / renew operations.',
    recommendedAction:
      'Migration playbook must originate every Asset with an AssetAction (type Originate) and AssetStatePeriod. Validate with a sample amend before bulk migration.',
    evidence: ev(
      ['3,600 active subscriptions to migrate.', 'KB §5.4 / P13 explicit.'],
      [{ metric: 'Active subscriptions', value: 3600, source: 'Org data volume' }],
      [],
    ),
  },
  {
    category: 'Data Migration',
    severity: 'Medium',
    finding: 'Historical CPQ quotes (38,000) should not migrate.',
    technicalDetail:
      'KB §5.4 / P12 explicit: freeze historical closed/won quotes in CPQ as read-only or move to a data warehouse. Migrating wastes effort and creates clutter.',
    recommendedAction:
      'Confirm with finance that read-only historical access in CPQ is acceptable for compliance and audit.',
    evidence: ev(
      ['38,000 historical quotes.', 'KB §5.4 / P12 explicit.'],
      [{ metric: 'Historical quotes', value: 38000, source: 'Org data volume' }],
      [],
    ),
  },

  // Integrations (2)
  {
    category: 'Integrations',
    severity: 'Medium',
    finding: 'Legacy provisioning integration has no documented API contract.',
    technicalDetail:
      'Outbound integration; no documentation surfaced during scan. Required input for DRO scoping.',
    recommendedAction:
      'Discovery session with the legacy system team before SOW commitment. Document the contract before estimating DRO LOE.',
    evidence: ev(
      ['Outbound integration with no docs.', 'Required input for KB §4.1 DRO scoping.'],
      [],
      ['concern-legacy-provisioning', 'opp-dro'],
    ),
  },
  {
    category: 'Integrations',
    severity: 'Medium',
    finding: 'Possible duplication between Avalara tax integration and the QCP tax pre-calc callout.',
    technicalDetail:
      'q-003 calls internal-tax.example.com per line; Avalara is also integrated. Two tax sources is unusual and may indicate a legacy fallback that finance has forgotten about.',
    recommendedAction: 'Confirm authoritative tax source with finance before migration; deprecate the duplicate path.',
    evidence: ev(
      ['Two tax integrations observed: Avalara and internal-tax.example.com.', 'q-003 routes per-line through the internal service.'],
      [],
      ['q-003'],
    ),
  },

  // Deprecated Config (1)
  {
    category: 'Deprecated Config',
    severity: 'Low',
    finding: 'Pre-migration audit needed: 47 inactive products and 18 orphaned price rules.',
    technicalDetail:
      'KB §5.1 / P3 explicit on the cost of migrating debris. Cleanup is hygiene, not feature work.',
    recommendedAction:
      'Run the audit during Discovery & Validation; freeze cleanup decisions before Foundation Setup begins.',
    evidence: ev(
      ['47 inactive products.', '18 orphaned price rules.'],
      [
        { metric: 'Inactive products', value: 47, source: 'Org scan' },
        { metric: 'Orphaned price rules', value: 18, source: 'Org scan' },
      ],
      ['concern-deprecated-cleanup'],
    ),
  },
];

// ---------------------------------------------------------------------------
// AI narratives — cite ORG-WIDE numbers from complexityScores signals
// ---------------------------------------------------------------------------

const aiNarratives = {
  executive: [
    'This org appears to be a medium-to-high complexity RCA migration based on 42 price rules, 7 QCP scripts, and 3 quote-calculation Apex dependencies.',
    'The largest single risk is pricing logic translation; the largest single win is replacing ~140 lines of bespoke amendment Apex with the native Initiate Amendment lifecycle action.',
    'Architectural fit is strong — Pricing Procedures, CML, Asset Lifecycle, and Advanced Approvals all map cleanly to what is in the org today.',
    'Recommended next step: run a pricing-focused validation workshop with the CPQ admin and the AllCloud delivery lead before SOW commitment.',
  ].join(' '),

  sales: [
    'Discovery angle: pricing intent before pricing implementation. The org runs 42 price rules, 7 QCP scripts, and 3 quote-calculation Apex pieces — the migration cost is mostly validating intent, not writing code.',
    'SOW caveat to repeat in every redline: pricing procedure design assumes validated pricing logic intent; variance triggers a change order.',
    'High-value win story: a 140-line bespoke amendment service maps to a single declarative Initiate Amendment action.',
    'Watch-out: the legacy provisioning integration has no documented API contract — get that contract before promising DRO scope.',
    'Suggested close: propose a paid 3–4 week Discovery & Validation phase before the full SOW; that aligns with the Medium confidence on the LOE.',
  ].join(' '),

  salesforce: [
    'This is a strong Revenue Cloud Advanced + Agentforce Revenue Management readiness profile: 42 price rules, 7 QCP scripts, 3 quote-calculation Apex dependencies, 14 product rules, 12 summary variables.',
    'Three high-confidence expansion signals are explicit in the org scan: DRO (legacy provisioning), Advanced Approvals (custom routing trigger + paid managed package), and Pricing Procedures (replacing the QCP + Apex pricing surface).',
    'Billing is a medium-confidence signal pending finance confirmation; Revenue Recognition is medium pending finance confirmation; Agentforce is a future-state introduction, not Phase 1 scope.',
    'Implementation risk concentrates on three KB pitfalls: §5.2 / P5 (Decision Table refresh after deploy), §5.4 / P13 (AssetStatePeriod required during subscription migration), and §5.3 / P9 (commit to CML or BRE for configuration, not both).',
    'Suggested partner positioning: AllCloud + Vento de-risk the pricing translation step — the single biggest source of post-go-live regression in CPQ → RCA migrations.',
  ].join(' '),
};

// ---------------------------------------------------------------------------
// Top-level payload
// ---------------------------------------------------------------------------

const payload: AssessmentPayload = {
  meta: {
    assessmentId: 'asm-allcloud-demo-001',
    generatedAt: '2026-05-08T00:00:00.000Z',
    orgName: 'Acme Cloud Holdings (sample)',
    orgIdentifier: '00DSAMPLEORG000',
    truthLabel: 'sample_data',
    schemaVersion: '1.0',
  },
  orgProfile: {
    edition: 'Enterprise',
    cpqVersion: "Spring '25 Managed Package",
    activeUsers: 180,
    dataVolume: {
      products: 340,
      activeQuotes: 2400,
      historicalQuotes: 38000,
      activeContracts: 1200,
      activeSubscriptions: 3600,
    },
    integrations: [
      { name: 'NetSuite', type: 'erp', direction: 'bidirectional' },
      { name: 'Avalara', type: 'tax', direction: 'outbound' },
      { name: 'Stripe', type: 'billing', direction: 'outbound' },
      { name: 'Legacy provisioning system', type: 'other', direction: 'outbound' },
    ],
  },
  verdict: {
    recommendation: 'Proceed_With_Caution',
    rationale:
      'Medium-to-high complexity migration (overall 68/100) with strong architectural fit. The largest risk is pricing logic translation across 7 QCP scripts and 3 quote-calculation Apex dependencies; the largest win is retiring ~140 lines of bespoke amendment Apex in favour of native Asset Lifecycle. Proceed conditional on a paid Discovery & Validation phase with the CPQ admin and the AllCloud delivery lead.',
  },
  complexityScores: {
    overall: 'High',
    overallNumeric: 68,
    dimensions: {
      pricingLogic: {
        score: 75,
        tier: 'High',
        signal: '42 price rules, 7 QCP scripts, 3 quote-calculation Apex dependencies',
        evidence: ev(
          ['Pricing logic spread across declarative rules, QCP, and Apex.', 'External tax callout on the pricing path.'],
          [
            { metric: 'Price rules', value: 42, source: 'Org scan' },
            { metric: 'QCP scripts', value: 7, source: 'Org scan' },
            { metric: 'Quote-calc Apex dependencies', value: 3, source: 'Static analysis' },
          ],
          ['q-001', 'q-003', 'a-001'],
        ),
      },
      productCatalog: {
        score: 55,
        tier: 'Medium',
        signal: '340 products, 28 bundles, 14 product rules',
        evidence: ev(
          ['Mid-sized catalog with moderate bundle count.', 'Product rule mix covers validation, selection, and filtering.'],
          [
            { metric: 'Products', value: 340, source: 'Org data volume' },
            { metric: 'Bundles', value: 28, source: 'Org scan' },
            { metric: 'Product rules', value: 14, source: 'Org scan' },
          ],
          ['pdr-001', 'pdr-002'],
        ),
      },
      customCode: {
        score: 72,
        tier: 'High',
        signal: '11 Apex classes, 6 Apex triggers, 7 QCP scripts, 12 summary variables',
        evidence: ev(
          ['Apex footprint dominated by amendment service and pricing trigger.', 'QCP density is high.'],
          [
            { metric: 'Apex classes', value: 11, source: 'Org scan' },
            { metric: 'Apex triggers', value: 6, source: 'Org scan' },
            { metric: 'QCP scripts', value: 7, source: 'Org scan' },
            { metric: 'Summary variables', value: 12, source: 'Org scan' },
          ],
          ['a-001', 'a-002', 'a-003', 'a-004'],
        ),
      },
      dataMigration: {
        score: 58,
        tier: 'Medium',
        signal: '3,600 active subscriptions, 1,200 active contracts, 38,000 historical quotes',
        evidence: ev(
          ['Active subscription volume drives Asset migration scope.', 'Historical quotes intentionally out of scope.'],
          [
            { metric: 'Active subscriptions', value: 3600, source: 'Org data volume' },
            { metric: 'Active contracts', value: 1200, source: 'Org data volume' },
            { metric: 'Historical quotes', value: 38000, source: 'Org data volume' },
          ],
          [],
        ),
      },
      integrations: {
        score: 65,
        tier: 'Medium',
        signal: '4 integrations: NetSuite (bi-directional), Avalara, Stripe, legacy provisioning',
        evidence: ev(
          ['Three integrations are documented.', 'Legacy provisioning lacks API documentation.'],
          [
            { metric: 'Integrations', value: 4, source: 'Org scan' },
            { metric: 'Documented contracts', value: 3, source: 'Org scan' },
          ],
          ['concern-legacy-provisioning'],
        ),
      },
      deprecatedConfig: {
        score: 50,
        tier: 'Medium',
        signal: '47 inactive products, 18 orphaned price rules',
        evidence: ev(
          ['Standard pre-migration hygiene scope.', 'Per KB §5.1 / P3 the most common audit item.'],
          [
            { metric: 'Inactive products', value: 47, source: 'Org scan' },
            { metric: 'Orphaned price rules', value: 18, source: 'Org scan' },
          ],
          ['concern-deprecated-cleanup'],
        ),
      },
    },
  },
  topConcerns: topConcerns as AssessmentPayload['topConcerns'],
  loeEstimate: {
    tier: 'High',
    weeksLow: 22,
    weeksHigh: 32,
    confidence: 'Medium',
    confidenceLimitingFactors: [
      'Missing admin validation of pricing logic intent',
      'Legacy provisioning integration lacks documented API contract',
      'Historical data migration scope not yet validated with finance',
    ],
    primaryDrivers: [
      'Custom QCP and Apex pricing logic depth',
      'Legacy provisioning integration translation',
      'Cross-line aggregation logic requiring Apex invocables',
      'Bundle complexity in product catalog',
    ],
    suggestedPhases: [
      {
        name: 'Discovery & Validation',
        durationWeeks: { low: 3, high: 4 },
        description: 'Validate pricing logic intent, map integrations, audit deprecated config.',
      },
      {
        name: 'Foundation Setup',
        durationWeeks: { low: 4, high: 6 },
        description: 'PCM, BRE / Context Service, base pricing procedures.',
      },
      {
        name: 'Migration Build',
        durationWeeks: { low: 8, high: 12 },
        description: 'Pricing procedures, CML constraints, custom invocables, amendment flows.',
      },
      {
        name: 'Integration & Data',
        durationWeeks: { low: 4, high: 6 },
        description: 'ERP / tax / payment integration, asset migration with AssetAction / AssetStatePeriod.',
      },
      {
        name: 'UAT & Hypercare',
        durationWeeks: { low: 3, high: 4 },
        description: 'User acceptance, training, go-live support.',
      },
    ],
    sowCaveats: [
      'Pricing procedure design assumes validated pricing logic intent — variance triggers change order.',
      'Legacy provisioning integration scoped pending API documentation review.',
      'Historical data migration limited to active subscriptions only.',
    ],
    changeOrderRisks: [
      'Discovery of additional QCP scripts not surfaced in initial assessment.',
      'Pricing logic intent diverges from observed behavior.',
      'Provisioning system requires bespoke integration work.',
    ],
    disclaimer: 'Demo heuristic. Requires validation by delivery lead before SOW commitment.',
  },
  rcaOpportunities,
  expansionSignals,
  codeInventory,
  rcaBenefitMapping,
  salesTalkingPoints,
  implementationFindings,
  aiNarratives,
};

// ---------------------------------------------------------------------------
// Write + validate
// ---------------------------------------------------------------------------

async function main() {
  const outPath = path.resolve('inputs/assessment-payload.json');
  await writeFile(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${outPath}`);

  const schemaText = await readFile(path.resolve('inputs/assessment-schema.json'), 'utf8');
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(JSON.parse(schemaText));
  if (!validate(payload)) {
    console.error('Generated payload failed schema validation:');
    for (const err of validate.errors ?? []) {
      console.error(`  ${err.instancePath || '/'} ${err.message}`);
    }
    process.exit(1);
  }
  console.log('Generated payload OK against schema.');

  // Quick consistency report.
  const cnt = (arr: unknown[]) => arr.length;
  const confidenceDist: Record<DraftConfidence, number> = {
    High: 0, Medium: 0, Low: 0, Manual_Review_Required: 0,
  };
  for (const a of codeInventory) confidenceDist[a.conversionConfidence]++;
  const sourceDist: Record<SourceType, number> = {
    QCP_JavaScript: 0, Apex_Class: 0, Apex_Trigger: 0, Price_Rule: 0,
    Product_Rule: 0, Discount_Schedule: 0, Summary_Variable: 0, Lookup_Query: 0,
  };
  for (const a of codeInventory) sourceDist[a.sourceType]++;

  console.log('--- Summary ---');
  console.log(`codeInventory: ${cnt(codeInventory)}`);
  console.log(`  by source:    ${JSON.stringify(sourceDist)}`);
  console.log(`  confidence:   ${JSON.stringify(confidenceDist)}`);
  console.log(`topConcerns: ${cnt(topConcerns)}`);
  console.log(`rcaOpportunities: ${cnt(rcaOpportunities)}`);
  console.log(`expansionSignals: ${cnt(expansionSignals)}`);
  console.log(`rcaBenefitMapping: ${cnt(rcaBenefitMapping)}`);
  console.log(`salesTalkingPoints: ${cnt(salesTalkingPoints)}`);
  console.log(`implementationFindings: ${cnt(implementationFindings)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
