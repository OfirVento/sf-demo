# CPQ → RCA Migration Reference

**AllCloud · Revenue Cloud Advanced (Agentforce Revenue Management)**
**Last updated:** 2026-05-08

---

## Table of Contents

1. [RCA Capability List](#1-rca-capability-list)
2. [CPQ → RCA Feature Mapping](#2-cpq--rca-feature-mapping)
3. [Code Conversion Patterns](#3-code-conversion-patterns)
4. [Common Upsell / Expansion Features](#4-common-upsell--expansion-features)
5. [Migration Pitfalls and Gotchas](#5-migration-pitfalls-and-gotchas)
6. [Terminology Glossary](#6-terminology-glossary)

---

## 1. RCA Capability List

Every module in Revenue Cloud Advanced with a one-line description.

### Core Modules

| Module | Description |
|--------|-------------|
| **Product Catalog Management (PCM)** | Define products, attributes, classifications, bundles, categories, and browsable catalogs — the single source of truth for everything sellable. |
| **Salesforce Pricing** | Dynamic pricing engine: price books, price adjustment schedules, attribute-based adjustments, bundle-based adjustments, derived pricing, cost books, and the price waterfall. |
| **Pricing Procedures (BRE)** | Step-based pricing execution flows built on Expression Sets and Decision Tables — replaces CPQ price rules and QCP with a declarative, auditable pipeline. |
| **Rate Management** | Rate cards, rate card entries, tiered/attribute-based rate adjustments, and rating frequency policies for usage-based and consumption pricing. |
| **Product Configurator** | Guided configuration of complex and bundled products using either BRE rules or the Constraint Modeling Language (CML) — ensures valid configurations before quote/order save. |
| **Constraint Modeling Language (CML)** | A domain-specific language for declaring product types, attributes, relationships, and constraints; compiled to ExpressionSet objects and solved in sub-second time even with 10,000+ lines. |
| **Transaction Management** | Quote and order capture — create, price, configure, approve, and convert quotes to orders; manages the full sales transaction lifecycle including groups and ramp deals. |
| **Asset Lifecycle Management** | Tracks the customer install base as Assets with full lifecycle: initial sale, amendment, renewal, cancellation, transfer, and rollback — each generating AssetAction + AssetStatePeriod records. |
| **Salesforce Contracts** | Contract creation from quotes/orders, obligation tracking, digital signatures, redlining, and AI-powered entity extraction (contract intelligence). |
| **Dynamic Revenue Orchestrator (DRO)** | Post-order fulfillment engine: decomposes orders into fulfillment plans with steps, dependencies, jeopardy rules, external callouts, and retry/fallout handling. |
| **Usage Management** | Track, aggregate, rate, and bill consumption-based products — manages usage resources, entitlements, summaries, overage processing, and commitment policies. |
| **Billing** | Invoice generation from billing schedules, billing treatments, billing policies, milestone-based billing, payment processing, credit memos, refunds, write-offs, and collections. |
| **Advanced Approvals** | Configurable multi-step approval workflows for quotes and orders using ApprovalSubmission and ApprovalWorkItem objects — replaces the CPQ Advanced Approvals managed package at no extra cost. |
| **Revenue Recognition** | Revenue schedules, revenue treatments, revenue distributions, GL account assignment rules — supports ASC 606 and IFRS 15 compliance. |
| **Tax Integration** | Pluggable tax engine framework supporting Avalara, Vertex, and custom tax providers through the TaxEngineAdapter Apex interface. |

### Platform Services (Industries Common)

| Service | Description |
|---------|-------------|
| **Business Rules Engine (BRE)** | Expression sets, decision tables, and lookup tables that power pricing calculations, qualification rules, approval logic, and configuration constraints across all RCA modules. |
| **Context Service** | Structured data schemas (Context Definitions + Context Mappings) that define input/output variables available during pricing, configuration, and qualification — replaces CPQ's twin-field architecture. |
| **Product Discovery** | Text-based search, faceted filtering, and guided selection (interactive questionnaires) for finding and recommending products from the catalog. |
| **Document Generation** | OmniStudio Document Generation or partner solutions (Conga, Formstack) for producing quote/proposal documents from transaction data. |

### AI & Agent Capabilities

| Capability | Description |
|------------|-------------|
| **Agentforce for Revenue Management** | AI agents with pre-built topics and actions for pricing recommendations, contract analysis, anomaly detection, and automated product recommendations. |
| **Token Overage Detection** | (Spring '26) Identifies token over-consumption and auto-generates targeted upsell quotes for token packs. |
| **Contract Intelligence** | AI-powered entity extraction and clause analysis on uploaded contract documents. |

### Integration & Developer Tools

| Capability | Description |
|------------|-------------|
| **Business APIs (Connect REST)** | Composite REST endpoints for all operations: pricing, configuration, transactions, billing, fulfillment. |
| **Invocable Actions** | 50+ standard Flow-callable actions across all modules (pricing, transaction, billing, DRO, usage). |
| **Platform Events** | Asynchronous event notifications: QuoteSaveEvent, PlaceOrderCompletedEvent, CreateAssetOrderEvent, BillingScheduleCreatedEvent, FulfillmentSourceChangeEvent, SalesTrxnDecompositionEvent. |
| **Metadata API Types** | Deployable configuration: RevenueManagementSettings, PricingRecipe, IndustriesPricingSettings, PricingActionParameters, ProcedureOutputResolution. |
| **Apex Namespaces** | Server-side access: RevSignaling, CommerceOrders, CommerceTax, PlaceQuote, and module-specific namespaces. |

---

## 2. CPQ → RCA Feature Mapping

### 2.1 Concept-Level Mapping

| CPQ Concept | RCA Equivalent | Paradigm Shift |
|-------------|---------------|----------------|
| **Quote Line Editor (QLE)** | Product Selector + Cart UX | Server-side pricing replaces browser-side JS calculation. UX is Flow-based and customizable. |
| **Product Bundles** (`SBQQ__ProductOption__c`) | PCM Bundles (`ProductRelatedComponent` + `ProductComponentGroup`) | Deeper nesting, richer attribute inheritance; components organized by groups, not flat options. |
| **Product Rules — Validation** | CML Constraints (`EnforcementType = Error`) | Declarative CML replaces point-and-click rule builder; supports 10K+ line items at sub-second solve. |
| **Product Rules — Selection** | CML Constraints (`ActionType = AutoInclude / AutoExclude`) | Same behavior, expressed as type relationships in CML instead of lookup-based rules. |
| **Product Rules — Alert** | CML Constraints (`EnforcementType = Warning`) | Identical UX behavior; CML authoring replaces click-based rules. |
| **Product Rules — Filter** | CML eligibility rule or Product Discovery qualification | Context-aware filtering replaces static lookup filters. |
| **Price Rules** (`SBQQ__PriceRule__c`) | Pricing Procedures (BRE Expression Sets + Decision Tables) | Step-based workflow replaces condition/action pairs. Full price waterfall audit trail. Dramatically more powerful. |
| **Discount Schedules** (`SBQQ__DiscountSchedule__c`) | Price Adjustment Schedules (`PriceAdjustmentSchedule` + `PriceAdjustmentTier`) | Range or Slab methods; supports volume, term, attribute, and bundle schedule types. |
| **Quote Calculator Plugin (QCP)** | Pricing Procedures + custom Apex invocable actions | JS runs in browser → server-side BRE + optional Apex. No more browser performance ceiling. |
| **Custom Apex pricing triggers** | BRE Expression Sets + Apex hooks in Procedure Plans | Declarative-first; Apex only for true edge cases via `ProcedurePlanOption.ApexClass`. |
| **Twin Fields** | Context Definitions + Context Mappings | Explicit, configurable field mappings replace rigid mirror fields. Any field on any object can participate. |
| **Guided Selling** | OmniStudio FlexCards + OmniScripts or Product Discovery Guided Selection | Modern UX; interactive questionnaires with product recommendations based on responses. |
| **Multi-Dimensional Quoting (MDQ)** | Ramp Deals + Group Ramp (`enableRampDeal`, `enableGroupRampPref`) | Native ramp segments with per-segment dates, quantities, and prices. More flexible than MDQ segments. |
| **Contracted Pricing** | Contract Item Price (`ContractItemPrice`) + BRE override logic | Direct object; no custom contracted price object needed. |
| **Subscription records** (`SBQQ__Subscription__c`) | Assets + AssetAction + AssetStatePeriod | Full lifecycle versioning; every change creates an auditable action record. MRR tracked natively. |
| **Amendments** (new quote on contract) | Transaction Management: Initiate Amendment Action | Asset-centric: creates new asset version, not a new quote. Prorated billing is automatic. |
| **Renewals** (clone quote with uplift) | Transaction Management: Initiate Renewal Action | Lifecycle event on existing asset. Auto-renew batch, configurable uplift, renewal price book. |
| **Cancellations** | Transaction Management: Initiate Cancellation Action | Generates prorated credits automatically. Supports immediate, end-of-term, and partial cancellation. |
| **CPQ Advanced Approvals (managed package)** | RCA Advanced Approvals (native) | No additional license cost. Built-in approval submissions, work items, and configurable workflows. |
| **Quote Templates** (`SBQQ__QuoteTemplate__c`) | OmniStudio Document Generation or partner (Conga/Formstack) | Start fresh with modern templates; don't replicate pixel-for-pixel. |
| **Summary Variables** | Custom Apex invocable + CML constraint or BRE Expression Set | Cross-line aggregation requires Apex; no direct equivalent to summary variables. |
| **Lookup Queries** | BRE Decision Tables or SOQL in Apex invocable | Decision Tables handle most lookup scenarios declaratively. |
| **Error Conditions** | CML constraints + BRE Expression Sets | Declarative constraint engine replaces procedural error checks. |

### 2.2 Object-Level Mapping

| CPQ Object | RCA Object | Key Differences |
|-----------|------------|-----------------|
| `SBQQ__Quote__c` | `Quote` (standard) or `Order` | RCA uses standard objects; often works directly at Order level. |
| `SBQQ__QuoteLine__c` | `QuoteLineItem` + `QuoteLineDetail` | No twin fields. QuoteLineDetail holds price waterfall. |
| `SBQQ__ProductOption__c` | `ProductRelatedComponent` | Bundle component definition within ProductComponentGroup. |
| `SBQQ__ProductRule__c` | `ProductConfigurationRule` (BRE) or CML model | Declarative constraints replace point-and-click rules. |
| `SBQQ__PriceRule__c` | Pricing Procedure step (Expression Set) | Step-based workflow, not condition/action pair. |
| `SBQQ__DiscountSchedule__c` | `PriceAdjustmentSchedule` + `PriceAdjustmentTier` | Supports Range and Slab adjustment methods. |
| `SBQQ__Subscription__c` | `Asset` + `AssetAction` + `AssetStatePeriod` | Full lifecycle; CPQ subscriptions are just billing records. |
| `SBQQ__ContractedPrice__c` | `ContractItemPrice` | Standard object; no custom package object. |
| `SBQQ__QuoteTemplate__c` | OmniStudio Document Template | Different technology; fresh start recommended. |
| `SBQQ__ProductFeature__c` | `ProductComponentGroup` | Features → component groups within bundles. |
| `SBQQ__OrderItemGroup__c` | `QuoteLineGroup` / standard Order Item hierarchy | Native grouping support. |
| `SBQQ__LookupQuery__c` | BRE Decision Table | Declarative lookup with dimensions and outputs. |
| `SBQQ__SummaryVariable__c` | Custom Apex Invocable Action | Must be built manually; no declarative equivalent. |
| `SBQQ__ConfigurationAttribute__c` | `ProductAttribute` + `AttributeDefinition` | Richer attribute model with classifications and picklists. |

---

## 3. Code Conversion Patterns

### 3.1 QCP (Quote Calculator Plugin) → Pricing Procedure

**CPQ — JavaScript QCP (browser-side):**
```javascript
// QCP: Apply 10% discount for Enterprise segment customers
export function onAfterCalculate(quoteModel, quoteLineModels, conn) {
  return new Promise((resolve, reject) => {
    const segment = quoteModel.record["SBQQ__Account__r"]["Segment__c"];
    if (segment === "Enterprise") {
      quoteLineModels.forEach(line => {
        line.record["SBQQ__AdditionalDiscount__c"] = 10;
      });
    }
    resolve();
  });
}
```

**RCA — BRE Pricing Procedure (declarative, server-side):**
```
Pricing Procedure: "PRC_SegmentDiscount_v1"
├── Step 1: Initialize Price (base price book lookup)
├── Step 2: Lookup Segment Discount
│   └── Decision Table: DT_SegmentDiscount
│       Inputs:  Account.Segment__c, Product.Family
│       Output:  Discount_Pct (Decimal)
│       Row:     Enterprise, * → 10.0
├── Step 3: Apply Discount
│   └── Expression: NetPrice = ListPrice × (1 - Discount_Pct / 100)
└── Step 4: Calculate Total
    └── Expression: TotalPrice = NetPrice × Quantity
```

No code. Fully declarative. Auditable via price waterfall.

---

### 3.2 Apex Price Rule → BRE Expression Set

**CPQ — Apex trigger for cost-plus pricing:**
```java
// CPQ: Calculate price as Cost + 25% margin
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
}
```

**RCA — Pricing Procedure with Cost Book:**
```
Pricing Procedure: "PRC_CostPlusMargin_v1"
├── Step 1: Initialize Price (standard price book lookup)
├── Step 2: Retrieve Cost
│   └── Decision Table: DT_CostLookup
│       Source: CostBookEntry (CostBook = "Standard Costs")
│       Inputs:  Product2Id
│       Output:  UnitCost (Currency)
├── Step 3: Apply Margin
│   └── Expression: NetPrice = UnitCost × 1.25
└── Step 4: Calculate Total
```

Zero Apex. Cost Book is a standard RCA object. Margin % can be a Decision Table lookup by product family if it varies.

---

### 3.3 CPQ Product Rule (Validation) → CML Constraint

**CPQ — Product Rule (declarative config):**
```
Product Rule: "Block_Starter_With_Enterprise_AddOn"
  Type: Validation
  Scope: Quote
  Conditions: Product.Family = "Starter"
  Error Condition:
    Tested Object: Quote Line
    Tested Field: SBQQ__Product__r.Family
    Operator: Equals
    Filter Value: "Enterprise Add-On"
  Error Message: "Enterprise Add-Ons cannot be combined with Starter plans."
```

**RCA — CML Constraint:**
```cml
type StarterPlan : LineItem {
    // Starter plan cannot coexist with Enterprise Add-Ons
    constraint noEnterpriseAddOn {
        description: "Enterprise Add-Ons cannot be combined with Starter plans."
        enforcement: Error
        condition: NOT exists(sibling where type == EnterpriseAddOn)
    }
}

type EnterpriseAddOn : LineItem {
    // marker type — no additional constraints
}
```

CML is compiled and solved at sub-second speed. The constraint is evaluated during configuration, not at save time.

---

### 3.4 CPQ Product Rule (Selection / Auto-Include) → CML Relationship

**CPQ — Product Rule (Selection):**
```
Product Rule: "Auto_Add_Support_With_Platform"
  Type: Selection
  Scope: Product
  Conditions: Product = "Platform License"
  Action: Add
  Action Product: "Basic Support"
  Action Quantity: 1
```

**RCA — CML with auto-include relationship:**
```cml
type PlatformLicense : LineItem {
    // Automatically include Basic Support when Platform is added
    relation support : BasicSupport[1..1] {
        default BasicSupport(1);
        constraint alwaysPresent {
            description: "Basic Support is mandatory with Platform License"
            enforcement: Error
            condition: count(support) >= 1
        }
    }
}
```

In CML, the relationship IS the rule. The `[1..1]` cardinality enforces mandatory inclusion. The `default` clause auto-populates it.

---

### 3.5 CPQ Discount Schedule → Price Adjustment Schedule

**CPQ — Discount Schedule (config):**
```
Discount Schedule: "Volume_Discount_Tiers"
  Type: Range
  Tier 1: 1-9 units → 0% discount
  Tier 2: 10-49 units → 5% discount
  Tier 3: 50-99 units → 10% discount
  Tier 4: 100+ units → 15% discount
```

**RCA — Price Adjustment Schedule + Tiers:**
```
PriceAdjustmentSchedule:
  Name: "Volume_Discount_Tiers"
  AdjustmentMethod: Range    # or Slab for graduated pricing
  Type: Volume

PriceAdjustmentTier records:
  | LowerBound | UpperBound | AdjustmentValue | AdjustmentType |
  |------------|------------|-----------------|----------------|
  | 1          | 9          | 0               | Percentage     |
  | 10         | 49         | 5               | Percentage     |
  | 50         | 99         | 10              | Percentage     |
  | 100        | null       | 15              | Percentage     |
```

Key difference: RCA supports both **Range** (one tier applies to all units) and **Slab** (each tier applies only to units within that range, i.e., graduated pricing). CPQ only supports Range-equivalent.

---

### 3.6 CPQ Apex Amendment Logic → RCA Invocable Action

**CPQ — Custom Apex for mid-term amendment:**
```java
// CPQ: Create amendment quote, copy lines, adjust dates
public class CPQ_AmendmentService {
    public static Id createAmendment(Id contractId) {
        SBQQ__Quote__c amendment = new SBQQ__Quote__c();
        amendment.SBQQ__Type__c = 'Amendment';
        amendment.SBQQ__MasterContract__c = contractId;
        amendment.SBQQ__StartDate__c = Date.today();
        // ... copy existing subscription lines ...
        // ... calculate prorated amounts manually ...
        // ... 100+ lines of Apex for proration, co-termination ...
        insert amendment;
        return amendment.Id;
    }
}
```

**RCA — Single invocable action call:**
```java
// RCA: One-liner. The platform handles proration, versioning, billing.
public class RCA_AmendmentService {
    @InvocableMethod(label='Amend Asset')
    public static List<Id> amendAsset(List<Id> assetIds) {
        // Option A: Call from Flow — no Apex needed at all
        // Option B: Call via Connect API
        ConnectApi.CommerceOrders.amendAsset(assetIds[0]);
        // Platform auto-creates:
        //   - New asset version (old → Superseded, new → Active)
        //   - AssetAction record (type = Amend)
        //   - Prorated billing schedule adjustments
        //   - Credit memo for prepaid unused period
        return assetIds;
    }
}
```

Or, more commonly, **zero Apex** — use the `commerceesb.AmendAsset` invocable action directly in a Flow.

---

### 3.7 CPQ Custom Apex Summary Variable → RCA Apex Invocable

**CPQ — Summary Variable (declarative but limited):**
```
Summary Variable: "Total_Discount_Across_All_Lines"
  Aggregate Function: SUM
  Target Object: Quote Line
  Target Field: SBQQ__Discount__c
  Filter: Active = true
```
Used in a Validation Rule: `Total_Discount_Across_All_Lines <= 30`

**RCA — Custom Apex Invocable Action (for cross-line aggregation):**
```java
public class RCA_CrossLineValidator {
    @InvocableMethod(label='Validate Total Discount')
    public static List<ValidationResult> validate(List<Id> quoteIds) {
        List<ValidationResult> results = new List<ValidationResult>();
        for (Id qId : quoteIds) {
            Decimal totalDiscount = 0;
            for (QuoteLineItem qli : [
                SELECT Discount FROM QuoteLineItem
                WHERE QuoteId = :qId
            ]) {
                totalDiscount += (qli.Discount != null ? qli.Discount : 0);
            }
            ValidationResult r = new ValidationResult();
            r.isValid = (totalDiscount <= 30);
            r.message = r.isValid ? '' : 'Total discount exceeds 30% cap.';
            results.add(r);
        }
        return results;
    }

    public class ValidationResult {
        @InvocableVariable public Boolean isValid;
        @InvocableVariable public String message;
    }
}
```

This invocable is then called from the pricing procedure or a validation flow. Summary variables have no direct declarative equivalent in RCA — this is one area where custom Apex is still required.

---

### 3.8 Conversion Quick Reference

| CPQ Code Pattern | RCA Replacement | Code Required? |
|-----------------|-----------------|----------------|
| QCP `onBeforeCalculate` / `onAfterCalculate` | Pricing Procedure steps (BRE) | No |
| Apex trigger on `SBQQ__QuoteLine__c` for pricing | Pricing Procedure + Decision Table | No |
| Apex trigger on `SBQQ__QuoteLine__c` for validation | CML Constraint or BRE Expression Set | No |
| Product Rule (Validation) | CML Constraint (`enforcement: Error`) | No |
| Product Rule (Selection) | CML Relationship with cardinality + default | No |
| Product Rule (Alert) | CML Constraint (`enforcement: Warning`) | No |
| Discount Schedule | PriceAdjustmentSchedule + PriceAdjustmentTier | No |
| Summary Variable (simple aggregation) | BRE Expression Set with SUM function | No |
| Summary Variable (complex cross-line logic) | Custom Apex Invocable Action | **Yes** |
| Custom amendment/renewal Apex | `commerceesb.AmendAsset` / `RenewAsset` invocable | No |
| QCP external callout | Pricing Procedure Apex hook (`ProcedurePlanOption.ApexClass`) | **Yes** |
| Custom proration calculation | `BillingTreatment.ProrationPolicy` configuration | No |
| Contracted price lookup | `ContractItemPrice` + pricing procedure fallback step | No |

---

## 4. Common Upsell / Expansion Features

These are the modules Salesforce wants partners to plant as seeds during initial implementations, with trigger conditions for when to introduce each.

### 4.1 Dynamic Revenue Orchestrator (DRO)

**What it does:** Automates post-order fulfillment — decomposes orders into steps, manages dependencies, calls external systems, handles retry/fallout.

**Seed when:**
- Customer has multi-step fulfillment (provisioning, shipping, activation, onboarding)
- Orders touch external systems (ERP, provisioning platforms, shipping providers)
- There is a handoff gap between "order placed" and "order fulfilled"
- Implementation includes telecom, manufacturing, or complex B2B with physical + digital products

**Trigger condition:** Customer mentions "we have a manual handoff after order activation" or "our ops team tracks fulfillment in spreadsheets."

### 4.2 Billing (Revenue Cloud Billing)

**What it does:** Invoice generation, payment processing, credit/debit management, milestone billing, usage billing, collections.

**Seed when:**
- Customer currently uses a separate billing system disconnected from Salesforce
- Billing is manual or semi-automated (spreadsheets, legacy systems)
- Customer needs consolidated invoicing across multiple subscriptions
- There are complex billing scenarios: milestone, usage-based, hybrid

**Trigger condition:** Customer mentions "our billing team re-keys data from Salesforce into [X]" or "we can't generate invoices from Salesforce today."

### 4.3 Advanced Approvals

**What it does:** Multi-step, configurable approval workflows for quotes and orders — parallel, sequential, delegated, with threshold-based triggers.

**Seed when:**
- Customer has complex approval chains (discount thresholds, deal size, product restrictions)
- Currently using CPQ Advanced Approvals managed package (free upgrade to RCA native)
- Approval processes span multiple levels (rep → manager → VP → legal → finance)

**Trigger condition:** Customer mentions "our approval process has more than two levels" or "we need line-level approvals."

### 4.4 Usage Management + Rate Management

**What it does:** Tracks consumption, manages entitlements, aggregates usage summaries, applies rate cards, and bills for overages.

**Seed when:**
- Customer sells any consumption/usage-based products (API calls, storage, compute, transactions)
- Customer is exploring hybrid pricing (subscription + usage)
- Customer mentions "we want to charge for overages" or "we need metered billing"

**Trigger condition:** Customer sells anything with a "per-unit" or "pay-as-you-go" component.

### 4.5 Revenue Recognition

**What it does:** Automates ASC 606 / IFRS 15 compliant revenue schedules, treatments, and GL distributions.

**Seed when:**
- Customer has public reporting obligations (SOX compliance, audited financials)
- Revenue recognition is currently managed in spreadsheets or a separate system
- Multi-element arrangements require allocation of standalone selling prices

**Trigger condition:** Customer mentions "our finance team manually calculates rev rec" or "we have ASC 606 compliance requirements."

### 4.6 Contract Lifecycle Management (CLM)

**What it does:** Contract creation, obligation tracking, redlining, version control, digital signatures, AI-powered entity extraction.

**Seed when:**
- Customer uses a separate CLM tool (Conga CLM, DocuSign CLM, Ironclad)
- Contract negotiation involves multiple rounds of redlining
- Customer wants AI to auto-extract key terms from uploaded contracts

**Trigger condition:** Customer mentions "our legal team manages contracts outside Salesforce" or "we want to automate contract clause extraction."

### 4.7 Product Discovery + Guided Selection

**What it does:** Text search, faceted filtering, and interactive questionnaires that recommend products based on customer needs.

**Seed when:**
- Customer has a large product catalog (500+ SKUs)
- Sales reps struggle to find the right products
- Customer wants to expose product search on Experience Cloud portals

**Trigger condition:** Customer mentions "our reps can never find the right product" or "we need a product recommendation engine."

### 4.8 Token Overage Detection (Spring '26)

**What it does:** Monitors token/credit consumption, detects over-usage, and auto-generates targeted upsell quotes for token packs.

**Seed when:**
- Customer sells AI/API products with token-based or credit-based pricing
- Customer wants automated upsell motions triggered by usage patterns

**Trigger condition:** Customer sells any token/credit-based product and mentions "we want to catch customers before they hit their limit."

### 4.9 Agentforce for Revenue Management

**What it does:** AI agents with pre-built topics for pricing intelligence, contract analysis, anomaly detection, and automated recommendations.

**Seed when:**
- Customer is already investing in Salesforce AI / Agentforce
- Customer wants AI-driven pricing recommendations or contract review
- Sales team needs intelligent deal scoring or discount recommendations

**Trigger condition:** Customer mentions "we want AI to help our reps price deals" or "we're already using Agentforce."

---

## 5. Migration Pitfalls and Gotchas

### 5.1 Architecture Pitfalls

**P1. Treating migration as lift-and-shift.**
RCA is not CPQ v2. The data model, pricing engine, and lifecycle model are fundamentally different. Attempting to replicate CPQ configurations 1:1 in RCA produces a brittle, suboptimal implementation. Every migration is a "transform and modernize" project.

**P2. Ignoring the asset-centric paradigm shift.**
CPQ is quote-line-centric. RCA is asset-lifecycle-centric. If the implementation team doesn't internalize this, they'll build workarounds for native capabilities — amendments, renewals, and cancellations should leverage Transaction Management, not custom order-creation logic.

**P3. Not auditing Ghost Products and Zombie Rules.**
Most legacy CPQ orgs have accumulated inactive products, orphaned price rules, and broken product rules over years. Migrating this debris into RCA wastes effort and creates configuration conflicts. Run a rigorous audit first.

**P4. Skipping the BRE / Context Service prerequisites.**
RCA pricing, configuration, and qualification all depend on BRE Expression Sets and Context Definitions. Teams that jump into building pricing procedures without mastering these prerequisites hit walls immediately.

### 5.2 Pricing Pitfalls

**P5. Not refreshing Decision Tables after deployment.**
This is the single most common post-deployment pricing bug. After deploying Decision Table metadata, you must explicitly refresh each table in the target org. Stale tables return wrong prices silently.

**P6. Hardcoded org-specific IDs in pricing procedure constants.**
Pricing procedures use constants that reference PriceAdjustmentSchedule IDs, Price Book IDs, and other org-specific values. These must be updated for each target environment. Automate this in your CI/CD pipeline.

**P7. Expecting QCP parity in the pricing engine.**
QCP ran arbitrary JavaScript in the browser. RCA pricing procedures are declarative-first. Complex QCP logic (external API callouts, recursive calculations, custom rounding) may require Apex invocable hooks in Procedure Plans, not a direct port.

**P8. Ignoring the price waterfall.**
RCA generates a transparent audit trail of every pricing step. Finance teams will use this. Design your pricing procedures with meaningful step names and explainability messages from day one.

### 5.3 Configuration Pitfalls

**P9. Not choosing between BRE and CML upfront.**
RCA offers two configuration rule engines. If both are enabled, CML takes precedence. Mixing them creates confusion. Pick one and commit.

**P10. Underestimating CML learning curve.**
CML is powerful but has a learning curve. It is a programming language with types, relations, and constraints — not a point-and-click builder. Budget training time.

**P11. ProductConfigurationRule BLOBs contain hardcoded record IDs.**
The `ConfigurationRuleDefinition` BLOB stores Salesforce record IDs from the source org. These don't survive cross-org deployment. Use the npm migration utility to remap IDs.

### 5.4 Data Migration Pitfalls

**P12. Trying to migrate historical CPQ quotes.**
Don't. Freeze historical closed/won quotes in CPQ as read-only. Migrate only active subscriptions (as Assets), active contracts, and open/pending transactions. Historical data stays in CPQ or moves to a data warehouse.

**P13. Forgetting to create AssetStatePeriod records.**
When migrating active subscriptions to Assets, you must create not just the Asset record but also the AssetAction (type: Originate) and AssetStatePeriod. Without these, Transaction Management cannot process amendments or renewals.

**P14. Not rebuilding the product index.**
After deploying product catalog data, the product search index must be rebuilt manually. Without this step, Product Discovery returns stale or missing results.

### 5.5 Integration Pitfalls

**P15. Billing without ERP integration.**
Deploying RCA Billing without connecting to the ERP (SAP, Oracle, NetSuite, Workday) leaves finance reconciling on spreadsheets. Plan the ERP integration as part of Phase 1, not a future phase.

**P16. Ignoring Platform Events in integration design.**
RCA fires platform events for every major lifecycle action. If your integrations rely on polling or triggers instead of subscribing to these events, you'll miss state transitions and create race conditions.

### 5.6 Deployment Pitfalls

**P17. Wrong deployment order.**
RCA components must be deployed in a specific sequence: Industries Common → PCM → Pricing → Configurator → Transaction Mgmt → DRO → Usage → Billing → Contracts. Deploying out of order causes dependency failures.

**P18. Active component version conflicts.**
You cannot deploy changes to an active Expression Set version. Deactivate the active version in the target org before deploying updates.

**P19. Non-extensible objects blocking GUID fields.**
Some RCA objects are protected and don't allow custom fields. Create an external reference table for GUIDs to track these objects across environments.

### 5.7 Organizational Pitfalls

**P20. Underestimating the training investment.**
RCA is not an upgrade — it's a new platform. Sales reps, deal desk, revenue ops, admins, and developers all need dedicated training. Budget 4-40 hours per role (see Section 2 training plan).

**P21. No post-go-live governance.**
RCA requires ongoing catalog maintenance, pricing rule updates, and billing schedule governance. Organizations that don't plan for a Revenue Operations Center of Excellence after go-live face operational degradation within 6 months.

---

## 6. Terminology Glossary

Preferred terminology as used by AllCloud and Salesforce in RCA implementations. The left column is the canonical term; the right column lists common aliases you may encounter.

### Platform & Product Names

| Canonical Term | Aliases / Former Names |
|---------------|----------------------|
| Revenue Cloud Advanced (RCA) | Agentforce Revenue Management, Revenue Lifecycle Management (RLM), Revenue Cloud, Rev Cloud |
| Salesforce CPQ (Legacy) | Steelbrick, Legacy CPQ, CPQ, SBQQ |
| Salesforce Billing (Legacy) | Billing managed package, BLNG |
| Revenue Cloud Billing | RCA Billing, native billing |
| Industries Common | Industries platform, shared services layer |

### Module Names

| Canonical Term | Aliases |
|---------------|---------|
| Product Catalog Management (PCM) | Catalog, product management, product master |
| Salesforce Pricing | Pricing engine, RCA pricing |
| Pricing Procedure | Pricing flow, pricing pipeline, pricing recipe execution |
| Business Rules Engine (BRE) | Expression engine, rules engine |
| Expression Set | Pricing procedure, BRE procedure, expression |
| Decision Table | Lookup table, BRE matrix, decision matrix |
| Context Definition | Context schema, context model |
| Context Mapping | Field mapping, context map |
| Product Configurator | Configurator, config engine, CPQ configurator |
| Constraint Modeling Language (CML) | Constraint language, CML model, configuration constraints |
| Constraint Builder | CML editor, constraint designer |
| Transaction Management | CPQ core, quote-to-order, sales transaction processing |
| Asset Lifecycle Management | Install base management, subscription management, asset management |
| Dynamic Revenue Orchestrator (DRO) | Fulfillment orchestration, order orchestration, DRO |
| Usage Management | Consumption management, metering, usage tracking |
| Rate Management | Rating engine, rate cards, usage pricing |
| Advanced Approvals | Approval workflows, approval automation |
| Contract Lifecycle Management (CLM) | Salesforce Contracts, contract management |
| Product Discovery | Product search, catalog search, guided selling |

### Key Objects

| Canonical Name | API Name | Notes |
|---------------|----------|-------|
| Quote | `Quote` | Standard object; replaces `SBQQ__Quote__c` |
| Quote Line Item | `QuoteLineItem` | Standard object; replaces `SBQQ__QuoteLine__c` |
| Quote Line Detail | `QuoteLineDetail` | Price waterfall details per line |
| Quote Line Group | `QuoteLineGroup` | Groups for ramp deals and segmented pricing |
| Order | `Order` | Standard object; extended with RCA fields |
| Order Item | `OrderItem` | Standard object; extended with RCA fields |
| Asset | `Asset` | Standard object; the customer's install base record |
| Asset Action | `AssetAction` | Lifecycle event: New, Amend, Renew, Cancel, Transfer, Rollback |
| Asset State Period | `AssetStatePeriod` | Point-in-time snapshot of asset state (MRR, quantity, dates) |
| Product | `Product2` | Standard object; extended with RCA classification and attributes |
| Product Selling Model | `ProductSellingModel` | One-Time, Term-Based, Evergreen, or Usage-Based |
| Price Book | `Pricebook2` | Standard price book; extended for selling models |
| Price Book Entry | `PricebookEntry` | List price per product/selling model/currency |
| Price Adjustment Schedule | `PriceAdjustmentSchedule` | Discount schedule container (volume, term, attribute, bundle) |
| Price Adjustment Tier | `PriceAdjustmentTier` | Individual discount tier within a schedule |
| Cost Book | `CostBook` | Product cost data for margin calculations |
| Contract Item Price | `ContractItemPrice` | Negotiated price for a specific contract |
| Billing Schedule | `BillingSchedule` | Defines when and how to bill |
| Billing Treatment | `BillingTreatment` | Billing behavior for product/selling model combination |
| Billing Policy | `BillingPolicy` | Billing rules configuration |
| Invoice | `Invoice` | Billing document; statuses: Draft, Posted, Paid, Void |
| Credit Memo | `CreditMemo` | Reduces amount owed on an invoice |
| Fulfillment Plan | `FulfillmentPlan` | DRO master container for order fulfillment |
| Fulfillment Step | `FulfillmentStep` | Individual fulfillment task within a plan |
| Rate Card | `RateCard` | Container for usage-based rate entries |
| Rate Card Entry | `RateCardEntry` | Individual rate per unit of consumption |
| Usage Summary | `UsageSummary` | Aggregated usage data for a billing period |
| Pricing Recipe | `PricingRecipe` | Maps pricing procedure to Decision Tables |
| Product Configuration Rule | `ProductConfigurationRule` | BRE-based configuration rule |
| Approval Submission | `ApprovalSubmission` | Approval request record |
| Approval Work Item | `ApprovalWorkItem` | Individual approval task |

### Pricing Terms

| Term | Definition |
|------|-----------|
| Price Waterfall | The transparent, step-by-step breakdown of how a final price was calculated — from list price through each adjustment. |
| List Price | The starting price from the PricebookEntry before any adjustments. |
| Net Price | Price after all adjustments (discounts, markups, contracted overrides) but before tax. |
| Selling Model | How a product is sold: One-Time, Term-Based (fixed subscription), Evergreen (no end date), Usage-Based. |
| Proration Policy | Rules for calculating partial-period charges: DailyProration, MonthlyProration, NoProration. |
| Delta Pricing | Performance optimization that reprices only changed line items, not the full transaction. |
| Derived Pricing | A pricing mechanism where one product's price is calculated from another product's price or asset data. |
| Ramp Deal | A pricing structure where quantity/price/terms change over defined segments during the subscription period. |
| Headless Pricing | Pricing execution without a UI context — used for background/batch/API-driven pricing. |
| Instant Pricing | (Spring '26) Recalculates only changed lines in real-time — performance optimization for large quotes. |

### Lifecycle Terms

| Term | Definition |
|------|-----------|
| Originate | The initial sale action that creates the first asset version. |
| Amend | A lifecycle action that modifies an existing asset (quantity change, product swap, add-on). |
| Renew | A lifecycle action that extends a subscription beyond its current end date. |
| Cancel | A lifecycle action that terminates a subscription (immediate, end-of-term, or partial). |
| Transfer | A lifecycle action that moves assets from one account to another. |
| Rollback | Undoes the most recent action on an asset, restoring the previous version. |
| Superseded | Status of an asset version that has been replaced by a newer version via amendment or renewal. |
| Co-Termination | Aligning multiple subscription end dates to a single renewal date. |
| MRR (Monthly Recurring Revenue) | Normalized monthly revenue for a subscription asset, tracked on AssetStatePeriod. |

### DRO Terms

| Term | Definition |
|------|-----------|
| Decomposition | Breaking a sales transaction into fulfillment lines and mapping them to executable steps. |
| Orchestration | Executing fulfillment steps in the correct order, respecting dependencies. |
| Fulfillment Scenario | Matches products to fulfillment plan templates. |
| Jeopardy Rule | SLA threshold that triggers escalation when a fulfillment step risks missing its target date. |
| Point of No Return | The stage in fulfillment beyond which a transaction cannot be cancelled or modified. |
| Freeze / Unfreeze | Locks or unlocks a sales transaction to prevent or allow modifications during fulfillment. |
| Fallout | A fulfillment step that has failed and requires intervention or retry. |

---

*This document is maintained as part of the AllCloud RCA Knowledge Base. For the full KB, see `50_final_kb/00_index/INDEX.md`.*
