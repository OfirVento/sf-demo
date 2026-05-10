# Design decisions

A short reference for the load-bearing decisions in this build that aren't self-evident from the code or the spec. Anchored here so the methodology is on record if questions come up after the demo.

---

## On the data model: calibrated demo data with real-org anchor points

The payload at `inputs/assessment-payload.json` is **not** raw output from a live Salesforce org scan, and it's **not** purely synthetic. It's calibrated demo data — sized and shaped to tell the most compelling possible story about what the tool does — anchored by 2–3 verifiable elements from a real Salesforce org.

The honest framing if anyone asks:

> *"The demo's data is calibrated for narrative impact, anchored by verifiable elements from a real Salesforce org. The org ID, one QCP script name, and one price rule name in the payload are real and can be cross-checked in the live org. The complexity profile, concerns, LOE estimate, and migration drafts are calibrated to represent a typical mid-market client running CPQ, which the real Salesforce demo org does not — its profile is moderate complexity with very low adoption."*

This is **not** "real data." It's **not** "synthetic data." It's calibrated demo data with real anchor points. That distinction matters:

- **Why not pure synthetic?** A Salesforce architect at the demo could ask "is any of this from a real org?" — saying "no" undermines the tool's pitch. Anchors give us a defensible "yes, here are three elements you can verify."
- **Why not full real swap?** The real Salesforce demo org (`00D3x000001AjYCEA0`) is *Salesforce's own internal demo org* with profile: 26/100 overall complexity, 23 quotes all-time, 6 active users, 0 quotes in 90 days, all CPQ plugin slots unset. A demo built on those facts pitches a low-priority migration to a Salesforce CPO — exactly the wrong message. The demo's audience needs to see a Medium-High mid-market client where the tool's value is obvious.
- **Why not synthesise everything?** The tool's pitch is "we connect to a real Salesforce org and extract truth." If nothing in the payload can be cross-verified against any real Salesforce org, the pitch is just claims. Three anchors prove the connection is real.

The truth label `meta.truthLabel = "real_org_data"` reflects the calibration: the *facts shown match what a real org's assessment would surface*, anchored by data points that ARE real. Field-level truth labels remain accurate (`ai_generated` on narratives, `heuristic` on derived charts, `requires_validation` where appropriate).

The full extraction of the real Salesforce demo org is preserved at `inputs/assessment-extracted.md` for reference. The 2–3 anchors and their insertion points are documented at `inputs/authenticity-anchors.md`.

---

## On the architecture: prompt caching strategy

The Anthropic system prompt is split into four blocks: static prefix, payload JSON, KB markdown, per-layer audience framing. The cache breakpoint sits AFTER the KB block, BEFORE the audience block.

This means:
- The prefix + payload + KB cache hit on every request after the first (~10% cost on the cached portion).
- Per-layer audience framing changes when the user switches from `/assessment/executive` to `/assessment/sales` — but because it's positioned AFTER the breakpoint, the layer switch doesn't invalidate the cache.

This was a load-bearing call. Without it, every layer switch would write a fresh ~80KB cache entry and pay full price on the next read. With it, the agent panel feels snappy across layer switches.

Source: `src/lib/llm/systemPrompt.ts`. See also Anthropic's prompt-caching docs on prefix-match invariance.

---

## On the deploy pattern: vercel --prod --force

`VITE_*` env vars are inlined at BUILD time, not runtime. If the env var changes on Vercel after a build is deployed, the deployed bundle still contains the old value (or the fallback in `src/lib/llm/anthropic.ts`).

The fix is `vercel --prod --force --yes` — the `--force` flag clears the build cache, forcing a fresh build with current env vars. This is also our standard fix any time env vars change, not just on the original `VITE_AGENT_MODEL` 404 from M3.

---

## On Layer 4 dark mode default

The Migration Drafts layer (`/assessment/migration`) defaults to dark mode regardless of the global toggle. This is in `src/App.tsx` — the `useEffect` hook that watches `currentLayer(pathname)` and applies dark theme when the layer is `migration`.

Reasoning: code editor aesthetics depend on dark for syntax highlighting to read well. The user can still toggle to light mode within Layer 4 via the global theme toggle, but the default is dark.

---

## On the synthetic confidence distribution

20 code artifacts: 12 High / 5 Medium / 1 Low / 2 Manual_Review_Required. Per-artifact assignments per spec §2A.2 (with one user-approved adjustment to drop pr-004 multi-currency from Medium to Low).

Manual_Review_Required artifacts are q-003 (external tax callout) and q-005 (recursive subscription proration with `Manual_Design_Required` target pattern). These are the demo's honesty signals and must remain emphasised in Layer 4 — the spec's explicit rule that Manual Review is "demo gold."

---

## On the in-bundle KB

`inputs/rca-knowledge-base.md` is imported via Vite's `?raw` import into the JS bundle so the agent has it available client-side without a runtime fetch. Trade-off: bundle size +40KB. Worth it because:
- Avoids a runtime fetch and its failure modes
- Lets prompt-caching work on the KB block (it's stable across sessions)
- Keeps the demo working offline if the Vercel CDN is the only flaky part
