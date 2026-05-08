import { useMemo } from 'react';
import { Lock } from 'lucide-react';
import { useAssessmentStore } from '@/store/useAssessmentStore';
import { TruthLabel } from '@/components/shared/TruthLabel';
import { FindingCard } from '@/components/layers/implementation/FindingCard';
import type { ImplementationFinding, Severity } from '@/types/assessment';

const SEVERITY_ORDER: Record<Severity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Info: 4,
};

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function ImplementationLayer() {
  const payload = useAssessmentStore((s) => s.payload);

  const grouped = useMemo(() => {
    const map = new Map<string, ImplementationFinding[]>();
    for (const f of payload?.implementationFindings ?? []) {
      const arr = map.get(f.category) ?? [];
      arr.push(f);
      map.set(f.category, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
    }
    return Array.from(map.entries());
  }, [payload]);

  const totalFindings = payload?.implementationFindings.length ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Locked v2.1 banner */}
      <div className="mb-8 flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
        <div className="mt-0.5 rounded-md bg-card p-2 text-muted-foreground">
          <Lock className="h-4 w-4" aria-hidden />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-foreground">
            Implementation report v2.1 — locked
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Future versions convert findings into work packages and migration tasks.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Implementation report
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            {totalFindings} findings across {grouped.length} categories.
          </p>
        </div>
        <TruthLabel variant="sample_data" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
        <aside className="md:sticky md:top-4 md:self-start">
          <nav aria-label="Sections" className="space-y-1 text-sm">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sections
            </div>
            {grouped.map(([category, items]) => (
              <a
                key={category}
                href={`#section-${slug(category)}`}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-ring"
              >
                <span>{category}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                  {items.length}
                </span>
              </a>
            ))}
          </nav>
        </aside>

        <div className="space-y-10">
          {grouped.length === 0 && (
            <p className="text-sm text-muted-foreground">No implementation findings in payload.</p>
          )}
          {grouped.map(([category, items]) => (
            <section
              key={category}
              id={`section-${slug(category)}`}
              className="scroll-mt-20 space-y-4"
            >
              <header className="flex items-baseline justify-between border-b border-border pb-2">
                <h2 className="text-lg font-semibold text-foreground">{category}</h2>
                <span className="text-xs text-muted-foreground">
                  {items.length} {items.length === 1 ? 'finding' : 'findings'}
                </span>
              </header>
              <div className="space-y-3">
                {items.map((finding, i) => (
                  <FindingCard key={i} finding={finding} index={i} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
