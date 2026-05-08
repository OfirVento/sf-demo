# Vento CPQ → RCA Assessment Tool — Build Spec v1.1

## 0. Project context

You are building an AI-native pre-sales assessment and migration application for AllCloud, a top-tier Salesforce SI. The app analyzes a customer's Salesforce CPQ org and produces five audience-specific surfaces that accelerate the CPQ → Revenue Cloud Advanced (RCA) sales cycle. Every AI output must be evidence-backed, audience-specific, and reviewable.

**Product positioning:** AI that understands a CPQ org, explains the migration by audience, scopes the work, identifies RCA opportunities, and generates reviewable RCA migration drafts for the highest-value logic — every conclusion backed by evidence from the org.

**Internal north star:** Every AI output is evidence-backed, audience-specific, and reviewable.

**This is a demo build.** The first deliverable is a live, interactive prototype intended to be shown to AllCloud, Salesforce partners, and prospective customers. Production hardening comes later.

---

## 1. Tech stack

- **Frontend:** React + TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui components
- **State:** Zustand (lightweight, no Redux)
- **Code highlighting:** Shiki (modern, VS Code themes)
- **Charts:** Recharts or Visx
- **LLM calls:** Anthropic Claude API (`claude-sonnet-4` or higher) for runtime agent + narrative
- **Routing:** React Router v6
- **Icons:** Lucide React

No backend required. All state in-memory. Assessment payload and RCA knowledge base imported as static files at build time.

---

## 2. Inputs (provided to you)

You will receive two files:

### 2.1 `rca-knowledge-base.md`
The RCA reference document covering capabilities, CPQ→RCA mappings, code conversion patterns, expansion triggers, pitfalls, and terminology. Used as runtime LLM context.

### 2.2 `assessment-schema.json`
The JSON Schema defining the assessment payload shape. Use it for TypeScript type generation.

### 2.3 No payload file — generate from instructions
**You will not receive a pre-processed `assessment-payload.json`.** You generate one yourself as a build-time step using Section 2A below, save it to `/inputs/assessment-payload.json`, and load it as a static import. The app consumes the payload at runtime — it does not regenerate it.

---

## 2A. Demo data generation instructions

Generate `assessment-payload.json` once and load it as a static import. The payload must conform to `assessment-schema.json`.

### 2A.1 Customer profile to model

Generate the payload as if assessing a realistic mid-market B2B SaaS company on Salesforce CPQ.

**Org profile:**
- Edition: Enterprise
- CPQ Version: Spring '25 managed package
- Active users: ~180
- Products: ~340 (mix of subscription tiers, add-ons, professional services SKUs)
- Active quotes: ~2,400
- Historical quotes: ~38,000
- Active contracts: ~1,200
- Active subscriptions: ~3,600
- Integrations: NetSuite (ERP, bidirectional), Avalara (tax, outbound), Stripe (payments, outbound), legacy in-house provisioning system (outbound)

**Complexity profile (Medium-to-High overall, ~68/100):**
This range is the demo sweet spot — high enough to surface interesting concerns and migration drafts, not so catastrophic that the verdict is "don't migrate."

Per-dimension targets:
- Pricing logic: High (~75)
- Product catalog: Medium (~55)
- Custom code: High (~72)
- Data migration: Medium (~58)
- Integrations: Medium-High (~65)
- Deprecated config: Medium (~50)

### 2A.2 Code inventory to generate

Generate ~18–22 code artifacts with this distribution:

**QCP scripts (5 artifacts):** Use patterns from KB Section 3.1.
- Segment-based discount logic → Pricing Procedure target, High confidence
- Bundle-aware pricing adjustment → Pricing Procedure + Decision Table, Medium confidence
- External callout for tax pre-calculation → Apex_Invocable_Extension, Manual Review Required
- Custom rounding logic → Pricing Procedure, High confidence
- Recursive subscription calculation → Manual Design Required

**Apex classes/triggers (4 artifacts):** Use patterns from KB Sections 3.2 and 3.7.
- Cost-plus pricing trigger → Pricing Procedure with Cost Book, High confidence
- Cross-line discount validator → Apex Invocable Action, Medium confidence
- Custom amendment logic → Declarative Configuration via Transaction Management, High confidence
- Quote approval routing trigger → Advanced Approvals declarative, High confidence

**Price rules (4 artifacts):** Use patterns from KB Section 3.3.
- Volume-based discount rule → Pricing Procedure step, High confidence
- Customer tier price override → Decision Table lookup, High confidence
- Promotional discount with date range → Pricing Procedure with date logic, Medium confidence
- Multi-currency adjustment rule → Pricing Procedure, Medium confidence

**Product rules (3 artifacts):** Use patterns from KB Sections 3.3 and 3.4.
- Validation rule blocking incompatible products → CML Constraint with `enforcement: Error`, High confidence
- Auto-include support with platform license → CML Relationship with cardinality, High confidence
- Filter rule for region-restricted products → Product Discovery qualification, Medium confidence

**Discount schedules (2 artifacts):** Use patterns from KB Section 3.5.
- Standard volume tiers → PriceAdjustmentSchedule + Tiers (Range method), High confidence
- Term-based graduated discount → PriceAdjustmentSchedule (Slab method), High confidence

**Summary variables (2 artifacts):**
- Total discount across lines → Apex Invocable Action, Medium confidence
- Aggregate quantity by product family → BRE Expression Set with SUM, High confidence

For each artifact, generate:
- Plausible CPQ source code (~15–40 lines, syntactically realistic — use KB examples as templates and vary names/values)
- Plain-language business purpose (1–2 sentences)
- Plausible RCA migration draft in the appropriate target language
- 2–4 preserved behaviors
- 1–3 changed behaviors
- 1–4 unknowns
- 3–5 required test scenarios
- Evidence trail with specific counts and references

Confidence distribution: ~50% High, ~35% Medium, ~10% Low, ~5% Manual Review Required.

### 2A.3 Top concerns to generate

5 concerns, ranked:

1. **Pricing logic translation risk** — Severity: High. 7 QCP scripts and custom Apex pricing.
2. **Custom amendment logic complexity** — Severity: High. Legacy Apex amendment service.
3. **Legacy provisioning integration** — Severity: Medium. Undocumented in-house API.
4. **Summary variable dependencies** — Severity: Medium. Cross-line aggregation requires Apex.
5. **Deprecated product cleanup needed** — Severity: Low. Audit before migration.

Each concern includes per-audience framing (executive, sales, salesforce) per the schema, plus an evidence trail.

### 2A.4 LOE estimate to generate

```
tier: "High"
weeksLow: 22
weeksHigh: 32
confidence: "Medium"
confidenceLimitingFactors: [
  "Missing admin validation of pricing logic intent",
  "Legacy provisioning integration lacks documented API contract",
  "Historical data migration scope not yet validated with finance"
]
primaryDrivers: [
  "Custom QCP and Apex pricing logic depth",
  "Legacy provisioning integration translation",
  "Cross-line aggregation logic requiring Apex invocables",
  "Bundle complexity in product catalog"
]
suggestedPhases: [
  { name: "Discovery & Validation", durationWeeks: { low: 3, high: 4 }, description: "Validate pricing logic intent, map integrations, audit deprecated config" },
  { name: "Foundation Setup", durationWeeks: { low: 4, high: 6 }, description: "PCM, BRE/Context Service, base pricing procedures" },
  { name: "Migration Build", durationWeeks: { low: 8, high: 12 }, description: "Pricing procedures, CML constraints, custom invocables, amendment flows" },
  { name: "Integration & Data", durationWeeks: { low: 4, high: 6 }, description: "ERP/tax/payment integration, asset migration with AssetAction/AssetStatePeriod" },
  { name: "UAT & Hypercare", durationWeeks: { low: 3, high: 4 }, description: "User acceptance, training, go-live support" }
]
sowCaveats: [
  "Pricing procedure design assumes validated pricing logic intent — variance triggers change order",
  "Legacy provisioning integration scoped pending API documentation review",
  "Historical data migration limited to active subscriptions only"
]
changeOrderRisks: [
  "Discovery of additional QCP scripts not surfaced in initial assessment",
  "Pricing logic intent diverges from observed behavior",
  "Provisioning system requires bespoke integration work"
]
disclaimer: "Demo heuristic. Requires validation by delivery lead before SOW commitment."
```

### 2A.5 RCA opportunities and expansion signals

Generate ~6–8 RCA opportunities pulling from KB Sections 1, 2, and 4:

- Pricing transparency via price waterfall (preserved benefit)
- CML for product configuration (preserved benefit)
- DRO expansion signal (triggered by legacy provisioning integration)
- Billing expansion signal (triggered by current Stripe + manual reconciliation pattern)
- Advanced Approvals expansion signal (triggered by complex approval routing trigger)
- Revenue Recognition opportunity (Medium confidence)
- Agentforce for Revenue Management opportunity (Low confidence, future state)

Each expansion signal uses consultative framing: *"may be relevant if..."* Never *"you should buy."*

### 2A.6 AI narratives (pre-generated)

Generate three narratives — executive, sales, salesforce — matching this voice principle: concrete numbers where supported, clear uncertainty where evidence is incomplete, decisive recommended next step.

Reference voice:
> *"This org appears to be a medium-to-high complexity RCA migration based on 42 price rules, 7 QCP scripts, and 3 quote-calculation Apex dependencies. The largest risk is pricing logic translation, which should be validated before SOW commitment. Recommended next step: run a pricing-focused migration review with the client's CPQ admin and AllCloud delivery lead."*

Each narrative ~3–5 sentences, audience-calibrated, ends with a decisive next action.

### 2A.7 Sales talking points

Generate 6–8 talking points distributed across contexts: discovery_call, sow_review, executive_meeting, salesforce_handoff. Each with `point` and `supportingData`.

### 2A.8 Implementation findings

Generate 12–18 findings across categories: Pricing, Configuration, Custom Code, Data Migration, Integrations, Deprecated Config. Severity distribution: ~30% Info/Low, ~50% Medium, ~20% High/Critical.

### 2A.9 Evidence trails

Every entity with an `evidence` field gets a populated three-level trail:
- **Summary:** 3–5 bullets, executive-readable
- **Detailed:** specific counts, names, references
- **Raw:** artifact references and synthetic metadata extracts

### 2A.10 Truth label

Set `meta.truthLabel: "sample_data"` for the entire payload. Every surface renders the blue "Sample data" badge. When real org data becomes available later, only the payload regenerates and the truth label flips to `"real_org_data"` — app code does not change.

### 2A.11 Internal consistency rules

The payload must be internally consistent:
- Counts in narratives must match counts in evidence trails must match actual counts in arrays
- An artifact flagged in a concern's evidence must exist in `codeInventory` with a matching ID
- An expansion signal's trigger condition must reference something present elsewhere in the payload
- LOE primary drivers must connect to top concerns
- Phase descriptions must reference work types implied by the code inventory

After generating the payload, do a consistency pass: for every numeric claim, verify the underlying array supports it.

---

## 3. Assessment payload schema

See `assessment-schema.json` (provided alongside this spec). Generate TypeScript types from it via `json-schema-to-typescript` or equivalent.

Key types you will work with frequently: `AssessmentPayload`, `CodeArtifact`, `Concern`, `EvidenceTrail`, `RcaOpportunity`, `ExpansionSignal`.

---

## 4. Application architecture

### 4.1 Five layers as routes

```
/                          → Landing / connect (mocked for demo)
/assessment/executive      → Layer 1
/assessment/sales          → Layer 2
/assessment/salesforce     → Layer 3
/assessment/migration      → Layer 4
/assessment/implementation → Layer 5
```

Each route renders one audience layer. Current layer determines agent panel calibration, prebuilt questions, evidence drawer formatting, and visual emphasis.

### 4.2 Persistent UI shell

Every layer route shares:
- **Top bar:** Vento logo, org name, layer switcher, truth label badge for current view, settings
- **Right panel (collapsible):** Agent panel with prebuilt questions for current layer + free-form input
- **Evidence drawer (slide-in from right):** Activated by any "View supporting evidence" link
- **Bottom-right:** Truth label legend (collapsible)

### 4.3 Guided workflow (default path)

First-time users see a guided overlay:
1. Connect org (stubbed — auto-progresses)
2. Run assessment (animated progress, 3–5s)
3. Pick your view (grid of 5 audience cards, recommended highlighted)
4. Review concerns
5. Ask the agent (prompts agent panel to expand)
6. Export or draft

Power users can dismiss. State persists in Zustand.

---

## 5. Layer specifications

### 5.1 Layer 1 — Executive

**Layout:** Single column, reading-first, generous whitespace.

**Components, top to bottom:**

1. **Hero verdict block.** Large verdict badge (Proceed / Proceed with caution / Needs deeper discovery), AI narrative paragraph below it (~24px), re-roll button on hover.
2. **Hero visual.** Single chart: current CPQ utilization vs. RCA upside. Two-bar or radial comparison. Truth label: "Heuristic estimate."
3. **Top concerns** (3–5 cards). Severity dot, headline, business impact, "View supporting evidence" link. Cards expand inline to show next action.
4. **RCA capabilities unlocked.** Tile grid (3-column desktop). Capability name, one-line benefit, "Learn more" pulls a small drawer with the KB description.
5. **Time-to-value framing.** Two stat cards: "Estimated migration: X–Y weeks" and "RCA capabilities live: Z modules." Each carries confidence label.

**Agent prebuilt questions:**
- Should we migrate now?
- What's the biggest business risk?
- What will slow this project down?
- What RCA capabilities could we unlock?

### 5.2 Layer 2 — Sales

**Layout:** Two-column. Left: narrative + talking points. Right: presentation-ready charts.

**Components:**

1. **AI talking points block** (left). Header "What to say on the discovery call." 4–6 talking points with supporting data line. Copy-button per point.
2. **Chart cards** (right, screenshot-ready). Each: title, chart, one-sentence takeaway, copy-as-image, copy-explanation. Charts:
   - Complexity by dimension (radar or grouped bar)
   - LOE breakdown by phase (stacked horizontal bar)
   - Top concerns severity distribution (severity tiles)
   - RCA opportunity count by category (donut)
3. **LOE / Scoping section** (full-width). Tier badge, weeks range, confidence badge with limiting factors expandable, primary drivers, suggested phases (timeline), SOW caveats, change-order risks. Disclaimer styled as soft banner.
4. **Risks as conversation prompts.** Cards reframing technical findings as "Ask the client about..." prompts.

**Agent prebuilt questions:**
- What should I say on the discovery call?
- What should go into the SOW?
- Where could scope creep happen?
- What caveats should I include?

**Critical:** every chart card must look good when screenshotted in isolation. Title + data + takeaway must be self-contained.

### 5.3 Layer 3 — Salesforce Partner

**Title:** "Revenue Cloud / Agentforce Revenue Management Readiness"

**Layout:** Dashboard-style, three-column responsive grid.

**Components:**

1. **Readiness verdict header.** Account name, readiness badge (Ready / Needs preparation / Not ready), pipeline framing line: "Discovery completed in minutes. SI-ready in [X] weeks."
2. **Expansion signals grid.** Each signal: module name, consultative framing line, trigger evidence on hover, confidence badge. Modules surface only when triggered — empty grid is fine.
3. **Migration risk profile.** Risk heatmap by category. Hover surfaces evidence. Click opens evidence drawer.
4. **Co-sell narrative card.** AI-generated paragraph framing how AllCloud + Vento de-risk the migration. Re-roll button.
5. **Account-ready summary export.** Button: "Generate one-page Salesforce briefing." Triggers printable view.

**Agent prebuilt questions:**
- Is this account ready for Revenue Cloud / Agentforce Revenue Management?
- What expansion signals exist?
- What should Salesforce position?
- What implementation risk should we warn the partner about?

### 5.4 Layer 4 — AI Migration Drafts

**The demo finale. Highest-craft surface.**

**Layout:** Full-width split. Left: code inventory list (350px). Right: three-pane viewer (flex-1).

**Components:**

1. **Code inventory list (left rail).**
   - Filter chips: All / QCP / Apex / Price Rules / Product Rules / Discount Schedules / Summary Variables
   - Sort: Complexity / Usage signal / Confidence
   - Each list item: artifact name, source type badge, complexity score (mini bar), usage signal icon, confidence badge
   - "Bulk draft high-confidence candidates" button at top. Modal lists eligible artifacts, confirms count, generates with progress.

2. **Three-pane viewer (right).**
   - **Left pane:** Original CPQ code. Shiki syntax highlighting. Source type label.
   - **Center pane:** AI plain-language explanation. Generous typography (~18px). Subhead: "What this code does." Business purpose line. Dependencies mini-list.
   - **Right pane:** Generated RCA migration draft. Tabs: "Draft" / "Reasoning" / "Tests".
     - **Draft tab:** Generated CML / BRE config / Apex invocable, syntax-highlighted. Plain-language explanation underneath. Target pattern badge at top.
     - **Reasoning tab:** Why this target pattern. Preserved behavior list. Changed behavior list. Unknowns list.
     - **Tests tab:** Required test scenarios as checklist.

3. **Per-draft metadata bar (above three-pane).**
   - Confidence badge (High/Medium/Low/Manual Review)
   - Target pattern badge
   - "Human review required" badge if true, with reasons on hover
   - Truth label: "AI-generated draft"
   - Evidence trail link

4. **Primary CTA:** "Generate RCA Draft" button. On first load, right pane shows skeleton state with this button centered. Click triggers generation (1.5s simulated load, then reveal). Once generated, button replaces with "Re-generate" and "Mark for review."

5. **Side-by-side diff toggle.** Switches three-pane to two-pane diff: left is CPQ behavior, right is RCA behavior, highlighted by preserved/transformed/deprecated.

**Agent prebuilt questions:**
- Why this target pattern?
- What edge cases should I test?
- What is unsafe to automate?
- What requires manual review?

**Visual requirement:** Modern code editor energy — VS Code aesthetic, generous monospace, high-end syntax highlighting. Not enterprise.

### 5.5 Layer 5 — Implementation

**Layout:** Traditional report. Two-column with left nav (section list) and right content area.

**Components:**

1. **Section nav.** Findings grouped by category.
2. **Findings list.** Each: severity badge, finding statement, technical detail (collapsible), recommended action, evidence trail link.
3. **Locked V2.1 banner.** Top: "Implementation report v2.1 — locked." Subtext: "Future versions convert findings into work packages and migration tasks."

**Agent prebuilt questions:**
- Why is this complexity rated high?
- What technical risks should I plan for?
- What's the dependency footprint?

---

## 6. Cross-cutting components (build once, reuse everywhere)

### 6.1 `<EvidenceLink>` and `<EvidenceDrawer>`
Inline text link "View supporting evidence" with small icon. On click, right-slide drawer with three tabs:
- **Summary** (default): 3–5 bullets from `evidence.summary`
- **Detailed**: table of `evidence.detailed` rows
- **Raw**: artifact references and metadata extracts (mono font, collapsible)

Drawer shares visual language with agent panel.

### 6.2 `<TruthLabel>`
Small badge. Five variants:
- 🟢 Real org data
- 🔵 Sample data
- 🟣 AI-generated draft
- 🟡 Heuristic estimate
- 🟠 Requires human validation

Tooltip on hover. Top-right of cards, top-left of full-page sections. Footer legend (collapsible) on every layer.

### 6.3 `<AgentPanel>`
Persistent right panel. Collapsible. When expanded:
- Header: "Ask the assessment"
- Layer-specific prebuilt questions as chips
- Free-form text input below
- Conversation thread above input
- Each agent response includes inline `<EvidenceLink>` where claims are grounded
- Re-roll on any agent response

LLM call structure:
```typescript
async function askAgent(question: string, context: {
  currentLayer: string;
  assessmentPayload: AssessmentPayload;
  knowledgeBase: string;
  conversationHistory: Message[];
}): Promise<AgentResponse>
```

### 6.4 `<ConfidenceBadge>` and `<SeverityBadge>`
Confidence: High (green), Medium (amber), Low (gray), Manual Review (orange). Severity: yellow → red gradient.

### 6.5 `<CodeBlock>`
Wraps Shiki. Light + dark themes, switched globally. Languages: `apex`, `javascript`, `cml` (custom grammar), `json`, `pseudocode`.

For CML: define a Shiki grammar treating it as TypeScript-flavored with custom keywords (`type`, `constraint`, `relation`, `enforcement`, etc.). Falls back to TypeScript highlighting if grammar fails.

### 6.6 `<ChartCard>`
Wrapper giving every chart screenshot-ready behavior: title, chart, one-sentence takeaway, copy-as-image (html-to-image), copy-explanation. Cards have generous padding and stand alone visually.

---

## 7. Design system

### 7.1 Aesthetic
Reference: Linear, Vercel, Anthropic. Restrained color, strong typography, generous whitespace, motion sparingly. No enterprise-SaaS-dashboard energy.

### 7.2 Color
```
--background: hsl(0 0% 100%)
--foreground: hsl(220 10% 12%)
--muted: hsl(220 10% 96%)
--muted-foreground: hsl(220 8% 45%)
--border: hsl(220 12% 90%)
--accent: hsl(245 70% 58%)
--severity-low: hsl(48 95% 60%)
--severity-medium: hsl(28 90% 58%)
--severity-high: hsl(8 80% 55%)
--severity-critical: hsl(355 75% 45%)
```
Dark mode from day one — code-editor layer especially needs it.

### 7.3 Typography
- Sans: Inter or Geist
- Mono: JetBrains Mono or Geist Mono
- Hero narrative: 24px / 1.5 / weight 400
- Section headers: 20px / weight 600
- Body: 16px / 1.6
- Code: 14px / 1.6

### 7.4 Spacing
8px grid. Cards have 24–32px internal padding. Sections separated by 48–64px vertical rhythm.

### 7.5 Motion
Tailwind `transition-all duration-200`. Drawers `transition-transform duration-300 ease-out`. No bouncy easings.

---

## 8. LLM integration

### 8.1 Two LLM roles

- **Build-time payload generation (one-time):** You generate `assessment-payload.json` per Section 2A. Done once during build, not at app runtime.
- **Runtime (in the app):** Agent panel Q&A, narrative re-rolls, talking-point regeneration, draft re-generation. The app makes Anthropic API calls during user interactions.

### 8.2 KB usage at runtime

The RCA knowledge base is the agent's reference manual:

- **Agent Q&A:** Pass full KB markdown as system prompt context. Use prompt caching so KB is cached once per session.
- **Draft re-generation:** When user clicks "Re-generate" on a Layer 4 draft, include relevant KB conversion pattern section (3.1–3.8) and current draft. Ask for alternative interpretation.
- **Narrative re-rolls:** Pass only assessment payload — KB unnecessary for narrative voice variation.
- **"Why this target pattern?" questions:** Include KB Section 3 (conversion patterns) and Section 5 (pitfalls) in context.

### 8.3 API setup

Use Anthropic SDK with `claude-sonnet-4` (or higher). API key from environment variable. Document the env var. Use `cache_control` on the KB and assessment payload blocks.

### 8.4 System prompt template

```
You are an expert Salesforce Revenue Cloud Advanced (RCA) consultant
helping with a CPQ → RCA migration assessment.

Current audience: {layer}
Layer-specific framing: {layer_framing_instructions}

You have access to:
1. The full assessment payload for this customer's org (provided below).
2. The RCA knowledge base reference (provided below).

Rules:
- Ground every claim in evidence from the assessment payload.
- Express clear uncertainty when evidence is incomplete.
- Use Revenue Cloud / Agentforce Revenue Management terminology when
  speaking to Salesforce-facing audiences.
- Frame expansion opportunities consultatively ("may be relevant if...")
  not as pitches.
- For migration draft questions, never claim production-readiness.
- Respond in plain language calibrated to the current audience.
- When referencing KB content, paraphrase rather than quote at length.

ASSESSMENT PAYLOAD:
{assessment_payload_json}

RCA KNOWLEDGE BASE:
{knowledge_base_md}
```

### 8.5 Streaming
Stream agent responses. Render tokens as they arrive.

---

## 9. Build sequence

| Milestone | Includes |
|---|---|
| **M0 — Skeleton** | Routing, layout shell, design tokens, Zustand store, payload import, truth label legend |
| **M1 — Layer 5 (Implementation)** | Simplest layer; validates payload schema and evidence drawer |
| **M2 — Layer 1 (Executive)** | Hero verdict, AI narrative, top concerns, RCA capabilities tiles |
| **M3 — Cross-cutting** | Agent panel with LLM integration, evidence drawer fully featured, truth labels everywhere |
| **M4 — Layer 2 (Sales)** | Talking points, screenshot-ready chart cards, LOE section with confidence |
| **M5 — Layer 3 (Salesforce)** | Readiness dashboard, expansion signals, co-sell narrative, briefing export |
| **M6 — Layer 4 (Migration Drafts)** | Code inventory, three-pane viewer, draft generation flow, diff toggle, bulk draft |
| **M7 — Guided workflow + polish** | Guided overlay, prebuilt questions live, dark mode pass, animation polish |
| **M8 — Demo readiness** | Full clickthrough rehearsal, edge case handling, performance pass |

---

## 10. Constraints and rules

1. **Do not invent runtime data.** Every visualization traces back to a field in the assessment payload. If missing, render a clear empty state — never fabricate. (Build-time generation per Section 2A is the exception.)
2. **Truth labels are non-optional.** Every surface that displays AI-generated content, heuristics, or sample data must carry the appropriate label.
3. **No CML for pricing logic.** Migration drafts respect architectural boundaries: pricing logic → Pricing Procedures or price adjustment methods. Configuration logic → CML. Render `recommendedRcaTarget` faithfully; never override.
4. **Paraphrase the KB.** When agent references KB, paraphrase rather than reproduce verbatim.
5. **Manual Review Required is first-class.** Drafts with this confidence visually emphasize the review requirement, not hide it. They are demo gold — they show honesty.
6. **Real org data badge gates real PII.** When real data is loaded later, never log it, never send it to third parties besides Anthropic.
7. **Animation is restraint.** No flourishes.
8. **No mock data fallback in production code paths.** If payload lacks an artifact, code inventory shows empty filtered state — not placeholder data.

---

## 11. Acceptance criteria for the demo

- [ ] All five layers render from the generated payload without errors
- [ ] Agent panel responds to free-form questions on every layer with evidence-grounded answers
- [ ] Prebuilt questions present and functional on every layer
- [ ] Evidence drawer opens from any "View supporting evidence" link with three-level content
- [ ] Truth labels visible on every surface that requires them
- [ ] Layer 4 generates a draft on click for at least 5 different artifacts
- [ ] Bulk draft completes for high-confidence candidates with visible progress
- [ ] Three of four chart cards on Layer 2 successfully copy-as-image
- [ ] LOE section displays confidence + limiting factors + disclaimer
- [ ] Expansion signals on Layer 3 only render when triggered
- [ ] Guided workflow runs end-to-end on first load
- [ ] Dark mode works across all layers
- [ ] Demo loads in under 3 seconds on a standard laptop

---

## 12. Files you will receive

```
/inputs
  /assessment-schema.json      ← JSON Schema for type generation
  /rca-knowledge-base.md       ← runtime LLM context
```

## 13. Files you will produce

```
/inputs
  /assessment-payload.json     ← generated per Section 2A, then static
/src
  /components
    /shared    ← EvidenceDrawer, AgentPanel, TruthLabel, ChartCard, CodeBlock
    /layers
      /executive
      /sales
      /salesforce
      /migration
      /implementation
  /lib
    /llm       ← Anthropic SDK wrapper, system prompts, streaming
    /assessment ← payload loader, type guards
  /pages
  /styles
  /store       ← Zustand
  App.tsx
  main.tsx
```

---

## 14. Clarifying questions before starting

Before writing code, ask Ofir:
1. Which Anthropic model should the agent panel use — `claude-sonnet-4` or `claude-opus-4`?
2. Should we validate the generated payload against the schema at load time and show an error UI for malformed payloads?
3. For the briefing export on Layer 3, is print-to-PDF acceptable for the demo, or is a styled PDF required?
4. Light mode primary, dark mode secondary — or both equal priority?
5. Any specific accounts the demo will be shown to that influence which expansion signals to emphasize?

---

## End of spec.
