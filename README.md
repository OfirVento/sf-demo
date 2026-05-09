# Vento CPQ → RCA Assessment Tool

AI-native pre-sales assessment for AllCloud. Analyzes a Salesforce CPQ org and produces five audience-specific surfaces (executive, sales, Salesforce partner, AI migration drafts, implementation report) for the CPQ → Revenue Cloud Advanced sales cycle.

This is a **demo build**. Status: **M0 — skeleton**.

## Stack

React 18 + TypeScript, Vite, Tailwind, Zustand, React Router v6, Ajv (schema validation), Shiki (added in M6), Recharts (added in M4), Anthropic SDK (added in M3).

## Getting started

```bash
npm install
npm run generate:types     # regenerate src/types/assessment.ts from inputs/assessment-schema.json
npm run validate:payload   # validate inputs/assessment-payload.json against the schema
npm run dev                # http://localhost:5173
npm run build              # type-check + production build
```

## Inputs

```
inputs/
  assessment-schema.json       # JSON Schema (source of truth for the payload)
  assessment-payload.json      # Static payload consumed at runtime (currently a stub)
  rca-knowledge-base.md        # RCA reference manual; runtime LLM context (M3+)
  build-spec-v11.md            # Full build specification
```

When real org data becomes available, only `assessment-payload.json` regenerates and `meta.truthLabel` flips from `sample_data` → `real_org_data`. App code does not change.

## Routes

```
/                                       Landing
/assessment/executive                   Layer 1
/assessment/sales                       Layer 2
/assessment/salesforce                  Layer 3
/assessment/salesforce/briefing         One-page Salesforce briefing (print-to-PDF)
/assessment/migration                   Layer 4 (defaults to dark mode)
/assessment/implementation              Layer 5
```

## Theme

Light mode primary. Global toggle in the top bar. Layer 4 (Migration drafts) forces dark mode regardless of the global setting — the code-editor aesthetic depends on it.

## Truth labels

Every surface that displays AI-generated content, heuristics, or sample data carries a `<TruthLabel>` badge. Five variants: `real_org_data`, `sample_data`, `ai_generated`, `heuristic`, `requires_validation`. Legend is collapsible at bottom-right.

## Schema validation

`assessment-payload.json` is validated against `assessment-schema.json` with Ajv on app boot. Validation failures render a dedicated error UI (loud failure beats silent wrongness in front of an audience).

## Environment variables (M3+)

Copy `.env.example` to `.env` and fill in:

```
VITE_AGENT_MODEL=claude-sonnet-4
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

`VITE_*` env vars are exposed in the browser bundle by Vite. The Anthropic SDK is initialised with `dangerouslyAllowBrowser: true` — acceptable for the AllCloud demo on a controlled URL, never for a public production environment. The agent panel and the Executive narrative re-roll both use this key; both fail gracefully with an error message if it's missing.

## Build sequence

| Milestone | Status |
|---|---|
| M0 — Skeleton (routing, shell, design tokens, stores, payload loader, truth labels, evidence drawer scaffold) | **Done** |
| M1 — Layer 5 (Implementation) | **Done** |
| M2 — Layer 1 (Executive) | **Done** |
| M3 — Cross-cutting (Anthropic agent, full evidence drawer, narrative re-rolls) | **Done** |
| M4 — Layer 2 (Sales) | Pending |
| M5 — Layer 3 (Salesforce Partner + briefing export) | Pending |
| M6 — Layer 4 (Migration drafts, three-pane viewer, bulk draft) | Pending |
| M7 — Guided workflow + polish | Pending |
| M8 — Demo readiness | Pending |
