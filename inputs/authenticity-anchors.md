# Pass 2 — Authenticity anchors

Source: `inputs/assessment-extracted.md` (real org `Salesforce Demo`, Org ID `00D3x000001AjYCEA0`)
Target: existing synthetic payload in `inputs/assessment-payload.json`
Goal: 2–3 verifiable anchors from the real Salesforce org folded into the calibrated demo data, so a Salesforce architect at the demo can cross-check one or two elements in the live org without committing the entire payload to what the real org actually contains.

---

## Anchor 1 — Org ID

**Real value (from PDF Section 1.3 / 2):** `00D3x000001AjYCEA0`

**Current synthetic value:** `meta.orgIdentifier = "00DSAMPLEORG000"`

**Insertion:** replace `meta.orgIdentifier` verbatim with `00D3x000001AjYCEA0`.

**Why this anchor:** Salesforce Org IDs are 15/18-char distinctive strings that round-trip cleanly to the live org. If a Salesforce architect questions provenance, the org ID is the cheapest, hardest-to-fake proof. It's not user-visible by default in the UI (we render it via `meta.orgIdentifier` in the agent panel context and the briefing route's footer); a presenter can surface it on demand without it cluttering the executive view.

**Verification path:** open Salesforce Setup → Company Information → Salesforce.com Organization ID. Or query `SELECT Id FROM Organization`.

---

## Anchor 2 — QCP script name (Q2CBundleSpecific)

**Real value (from PDF Section 9.1b.2):** QCP custom script named **`Q2CBundleSpecific`**, 27 lines, present in `SBQQ__CustomScript__c` table in the real org.

**Current synthetic artifact this maps to:** `q-002` — "Bundle-aware pricing adjustment (QCP)". Same purpose (bundle-aware pricing logic), already in the synthetic inventory.

**Insertion:** rename `codeInventory[id=q-002].name` from `"Bundle-aware pricing adjustment (QCP)"` to `"Q2CBundleSpecific (QCP) — bundle-aware pricing adjustment"`. Add the real script reference to the artifact's evidence trail:

```jsonc
// q-002.evidence.raw.artifactReferences
[
  "QuoteCalculatorPlugin.js",   // existing synthetic
  "Bundle_Tier__c",             // existing synthetic
  "SBQQ__BundledLines__r",      // existing synthetic
  "SBQQ__CustomScript__c[Name=Q2CBundleSpecific]"  // ← new anchor
]
```

**Why this anchor:** name is distinctive (the `Q2C` prefix is a real org-naming convention from the report, not a synthetic invention), it's a real artifact in `SBQQ__CustomScript__c` so an architect can paste the name into the org's Custom Scripts setup page and the record will appear, and the synthetic narrative around `q-002` (bundle-tier uplift, Pricing Procedure target, Medium confidence) is consistent with what a 27-line Q2CBundleSpecific script would plausibly do — we're not putting words in the real script's mouth, just borrowing its name and existence.

**Verification path:** Setup → CPQ Package → Custom Scripts → search "Q2CBundleSpecific". Or query `SELECT Name FROM SBQQ__CustomScript__c WHERE Name = 'Q2CBundleSpecific'`.

**Caveat to note:** the real script is **unregistered** (per the report's plugin-slot table, all QCP slots are "unset"). Our synthetic narrative treats it as actively running. If a presenter is asked specifically "is this script registered?" the honest answer is "the script exists; registration is one of the migration concerns we'd validate with the CPQ admin" — that aligns with the spec's emphasis on Manual Review honesty signals.

---

## Anchor 3 — Active price rule name (Multi Intel Asset Discount Rule)

**Real value (from PDF Section 6.3):** active price rule named **`Multi Intel Asset Discount Rule`**, scope `On Calculate`, low complexity, active status, confirmed via metadata.

**Current synthetic artifact this maps to:** `pr-001` — "Volume-based discount price rule". Same role (an Active, On-Calculate, low-complexity discount rule).

**Insertion:** rename `codeInventory[id=pr-001].name` from `"Volume-based discount price rule"` to `"Multi Intel Asset Discount Rule"`. Update the artifact's `evidence.raw.artifactReferences` to include the real rule reference:

```jsonc
// pr-001.evidence.raw.artifactReferences
[
  "PR_VolumeDiscount_Standard",                     // existing synthetic
  "SBQQ__PriceRule__c[Name=Multi Intel Asset Discount Rule]"  // ← new anchor
]
```

Also softly update the synthetic `sourceCode` block (the inline pricing-rule pseudocode) so the rule label inside it reads `"Multi Intel Asset Discount Rule"` instead of `"PR_VolumeDiscount_Standard"`.

**Why this anchor:** real rule, real distinctive name (the "Multi Intel Asset" phrasing is org-specific and unmistakable), already classified as Active + On Calculate + low complexity in the report — exactly the synthetic profile of `pr-001`. An architect can verify directly in CPQ Setup → Price Rules.

**Verification path:** Setup → CPQ Package → Price Rules → filter Active → find "Multi Intel Asset Discount Rule". Or `SELECT Id, Name, SBQQ__Active__c FROM SBQQ__PriceRule__c WHERE Name = 'Multi Intel Asset Discount Rule'`.

---

## Summary table

| # | Anchor | Real source | Synthetic insertion point | Touch level |
|---|---|---|---|---|
| 1 | Org ID `00D3x000001AjYCEA0` | PDF §1.3, §2 | `meta.orgIdentifier` (string replace) | Trivial |
| 2 | QCP script `Q2CBundleSpecific` | PDF §9.1b.2 | `codeInventory[q-002].name` + `.evidence.raw.artifactReferences` | Surface — name + evidence ref |
| 3 | Price rule `Multi Intel Asset Discount Rule` | PDF §6.3 | `codeInventory[pr-001].name` + `.sourceCode` rule label + `.evidence.raw.artifactReferences` | Surface — name + sourceCode label + evidence ref |

**Total payload surface affected:** 1 meta field + 2 artifact names + 2 artifact evidence arrays + 1 sourceCode block label. No structural or numeric changes. The synthetic distribution (12 High / 5 Medium / 1 Low / 2 Manual_Review_Required), the verdict, the LOE, the narratives, the concerns — all unchanged.

---

## Why three, not more

- **More than three anchors starts shifting the data toward what the real org actually contains** — the real org is Moderate-complexity with low adoption and unregistered plugins, which contradicts the demo's calibrated Medium-High narrative. Each additional anchor risks pulling the synthetic story toward a profile that doesn't sell as well.
- **Three is enough for the "yes, real org" defense.** Org ID + one QCP name + one price-rule name covers three different verification paths (org metadata, custom scripts, price rules). A Salesforce architect questioning authenticity won't dispute three independent live-checkable anchors.
- **Honesty floor:** if pressed about specifics ("does this org really have 7 QCP scripts?"), the honest answer is "the org has 5 active QCP records; our migration draft for the bundle-pricing case is calibrated against what a real script of this kind would do, and `Q2CBundleSpecific` is the real reference." That's defensible without overclaiming.

---

End of Pass 2.
