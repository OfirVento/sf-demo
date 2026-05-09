import { useState } from 'react';
import { AlertTriangle, ChevronDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfidenceBadge } from '@/components/shared/Badges';
import { TruthLabel } from '@/components/shared/TruthLabel';
import type { AssessmentPayload } from '@/types/assessment';

const TIER_STYLE: Record<AssessmentPayload['loeEstimate']['tier'], string> = {
  Low: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  Medium: 'bg-severity-medium/15 text-severity-medium',
  High: 'bg-severity-high/15 text-severity-high',
  'Very High': 'bg-severity-critical/15 text-severity-critical',
};

export function LoeSection({ payload }: { payload: AssessmentPayload }) {
  const loe = payload.loeEstimate;
  const [factorsOpen, setFactorsOpen] = useState(false);

  const totalLow = loe.suggestedPhases.reduce((s, p) => s + p.durationWeeks.low, 0);
  const totalHigh = loe.suggestedPhases.reduce((s, p) => s + p.durationWeeks.high, 0);

  return (
    <section className="space-y-6 rounded-lg border border-border bg-card p-6">
      <header className="flex items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">LOE / Scoping</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tier, weeks, confidence, drivers, phases, caveats, change-order risks.
          </p>
        </div>
        <TruthLabel variant="heuristic" />
      </header>

      {/* Headline numbers */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tier
          </div>
          <span
            className={cn(
              'mt-2 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold',
              TIER_STYLE[loe.tier],
            )}
          >
            {loe.tier}
          </span>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Weeks
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              {loe.weeksLow}–{loe.weeksHigh}
            </span>
            <span className="text-xs text-muted-foreground">weeks</span>
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Confidence
          </div>
          <div className="mt-2">
            <ConfidenceBadge confidence={loe.confidence} />
            <button
              type="button"
              onClick={() => setFactorsOpen((v) => !v)}
              className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground focus-ring"
              aria-expanded={factorsOpen}
            >
              <ChevronDown
                className={cn('h-3 w-3 transition-transform', factorsOpen && 'rotate-180')}
              />
              {loe.confidenceLimitingFactors.length} limiting factor
              {loe.confidenceLimitingFactors.length === 1 ? '' : 's'}
            </button>
            {factorsOpen && (
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-foreground/85">
                {loe.confidenceLimitingFactors.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Primary drivers */}
      <div>
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Primary drivers
        </div>
        <ul className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          {loe.primaryDrivers.map((d, i) => (
            <li
              key={i}
              className="rounded-md border border-border bg-muted/20 px-3 py-2 text-foreground/90"
            >
              {d}
            </li>
          ))}
        </ul>
      </div>

      {/* Suggested phases — timeline */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-foreground">Suggested phases</h3>
          <span className="text-xs text-muted-foreground">
            Total: {totalLow}–{totalHigh} weeks
          </span>
        </div>
        <div className="space-y-2">
          {loe.suggestedPhases.map((p) => {
            const widthPctLow = (p.durationWeeks.low / totalHigh) * 100;
            const widthPctExtra = ((p.durationWeeks.high - p.durationWeeks.low) / totalHigh) * 100;
            return (
              <div key={p.name} className="grid grid-cols-[170px_1fr_auto] items-center gap-3 text-sm">
                <div className="font-medium text-foreground/90">{p.name}</div>
                <div className="relative h-6 overflow-hidden rounded-md bg-muted/40" title={p.description}>
                  <div className="flex h-full">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${widthPctLow}%` }}
                      aria-label={`${p.durationWeeks.low} weeks (low)`}
                    />
                    <div
                      className="h-full bg-accent/40"
                      style={{ width: `${widthPctExtra}%` }}
                      aria-label={`+${p.durationWeeks.high - p.durationWeeks.low} weeks (range)`}
                    />
                  </div>
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  {p.durationWeeks.low}–{p.durationWeeks.high}w
                </div>
              </div>
            );
          })}
        </div>
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {loe.suggestedPhases.map((p) => (
            <li key={p.name}>
              <span className="font-medium text-foreground/80">{p.name}:</span> {p.description}
            </li>
          ))}
        </ul>
      </div>

      {/* SOW caveats + change-order risks side by side */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">SOW caveats</h3>
          <ul className="space-y-2">
            {loe.sowCaveats.map((c, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-md border border-border bg-muted/10 p-3 text-sm text-foreground/90"
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Change-order risks</h3>
          <ul className="space-y-2">
            {loe.changeOrderRisks.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-md border border-severity-medium/30 bg-severity-medium/5 p-3 text-sm text-foreground/90"
              >
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-severity-medium"
                  aria-hidden
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Disclaimer banner */}
      <div className="rounded-md border border-truth-heuristic/30 bg-truth-heuristic/10 p-3 text-sm text-foreground/85">
        {loe.disclaimer}
      </div>
    </section>
  );
}
