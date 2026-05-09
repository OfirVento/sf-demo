import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TruthLabel } from '@/components/shared/TruthLabel';
import { useEvidenceDrawerStore } from '@/store/useEvidenceDrawerStore';
import type { AssessmentPayload, ImplementationFinding, Severity } from '@/types/assessment';

const SEVERITY_ORDER: Severity[] = ['Info', 'Low', 'Medium', 'High', 'Critical'];

const SEVERITY_WEIGHT: Record<Severity, number> = {
  Info: 1,
  Low: 2,
  Medium: 3,
  High: 4,
  Critical: 5,
};

/** Compose a synthetic evidence trail for a category × severity bucket
 * by aggregating the underlying findings. */
function trailFromFindings(findings: ImplementationFinding[]) {
  const summary = findings.slice(0, 4).map((f) => f.finding);
  return {
    summary: (summary.length === 0 ? ['No findings recorded for this cell.'] : summary) as
      AssessmentPayload['topConcerns'][number]['evidence']['summary'],
    detailed: findings.map((f) => ({
      metric: f.finding,
      value: f.severity,
      source: f.recommendedAction,
    })),
    raw: {
      artifactReferences: findings.flatMap((f) => f.evidence.raw.artifactReferences),
    },
  };
}

export function MigrationRiskHeatmap({ payload }: { payload: AssessmentPayload }) {
  const { categories, matrix } = useMemo(() => {
    const grouped = new Map<string, ImplementationFinding[]>();
    for (const f of payload.implementationFindings) {
      const arr = grouped.get(f.category) ?? [];
      arr.push(f);
      grouped.set(f.category, arr);
    }
    const cats = Array.from(grouped.keys());
    const m: Record<string, Record<Severity, ImplementationFinding[]>> = {};
    for (const c of cats) {
      m[c] = { Info: [], Low: [], Medium: [], High: [], Critical: [] };
      for (const f of grouped.get(c) ?? []) {
        m[c][f.severity].push(f);
      }
    }
    return { categories: cats, matrix: m };
  }, [payload]);

  const show = useEvidenceDrawerStore((s) => s.show);

  // Highest-weight cell defines the "max" intensity scale, so a single
  // High in one cell doesn't drown out a Medium cluster elsewhere.
  const maxCount = Math.max(
    1,
    ...categories.flatMap((c) => SEVERITY_ORDER.map((s) => matrix[c][s].length)),
  );

  return (
    <section className="space-y-4">
      <header className="flex items-start justify-between gap-3 border-b border-border pb-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Migration risk profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hover a cell for the count. Click any non-empty cell to open the evidence trail.
          </p>
        </div>
        <TruthLabel variant="ai_generated" />
      </header>

      <div className="rounded-lg border border-border bg-card p-4">
        <div
          className="grid gap-1 text-xs"
          style={{ gridTemplateColumns: `minmax(150px,1fr) repeat(${SEVERITY_ORDER.length}, minmax(0, 64px))` }}
        >
          <div className="px-2 py-1 font-medium text-muted-foreground" />
          {SEVERITY_ORDER.map((s) => (
            <div key={s} className="px-1 py-1 text-center font-medium uppercase tracking-wide text-muted-foreground">
              {s}
            </div>
          ))}

          {categories.map((c) => (
            <div key={c} className="contents">
              <div className="flex items-center px-2 py-2 font-medium text-foreground">
                {c}
              </div>
              {SEVERITY_ORDER.map((s) => {
                const findings = matrix[c][s];
                const count = findings.length;
                const intensity = count === 0 ? 0 : Math.min(1, count / maxCount);
                const weight = SEVERITY_WEIGHT[s];
                // Color shifts from accent (low severity) to severity-high (high)
                // by mapping the severity weight onto a hue-like step.
                const color =
                  weight <= 2
                    ? 'bg-accent'
                    : weight === 3
                    ? 'bg-severity-medium'
                    : weight === 4
                    ? 'bg-severity-high'
                    : 'bg-severity-critical';
                const opacity = count === 0 ? 0 : 0.15 + intensity * 0.65;

                return (
                  <button
                    key={s}
                    type="button"
                    disabled={count === 0}
                    onClick={() =>
                      show(`${c} · ${s}`, trailFromFindings(findings))
                    }
                    title={count === 0 ? 'No findings' : `${count} ${s} finding${count === 1 ? '' : 's'} in ${c}`}
                    className={cn(
                      'flex h-12 items-center justify-center rounded-sm font-mono text-sm transition-all',
                      count === 0
                        ? 'cursor-default bg-muted/30 text-muted-foreground'
                        : 'cursor-pointer hover:ring-2 hover:ring-foreground/20',
                      count > 0 && color,
                    )}
                    style={{ opacity: count === 0 ? 1 : opacity, color: count > 0 ? 'hsl(var(--card))' : undefined }}
                  >
                    {count === 0 ? '·' : count}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
