import { useMemo } from 'react';
import { AlertTriangle, FileWarning, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMigrationStore } from '@/store/useMigrationStore';
import type { CodeArtifact, SourceType } from '@/types/assessment';

const SOURCE_LABEL: Record<SourceType, string> = {
  QCP_JavaScript: 'QCP',
  Apex_Class: 'Apex',
  Apex_Trigger: 'Apex',
  Price_Rule: 'Price Rule',
  Product_Rule: 'Product Rule',
  Discount_Schedule: 'Discount Schedule',
  Summary_Variable: 'Summary Variable',
  Lookup_Query: 'Lookup',
};

const SOURCE_FILTER: Array<SourceType | 'All'> = [
  'All',
  'QCP_JavaScript',
  'Apex_Class',
  'Price_Rule',
  'Product_Rule',
  'Discount_Schedule',
  'Summary_Variable',
];

const FILTER_LABEL: Record<SourceType | 'All', string> = {
  All: 'All',
  QCP_JavaScript: 'QCP',
  Apex_Class: 'Apex',
  Apex_Trigger: 'Apex',
  Price_Rule: 'Price Rules',
  Product_Rule: 'Product Rules',
  Discount_Schedule: 'Discount Schedules',
  Summary_Variable: 'Summary Variables',
  Lookup_Query: 'Lookup',
};

const USAGE_DOT: Record<string, string> = {
  Confirmed_Usage: 'bg-emerald-500',
  Active_Or_Referenced: 'bg-accent',
  Unknown: 'bg-muted-foreground',
  Deprecated_Or_Inactive: 'bg-severity-medium',
};

const CONFIDENCE_BADGE: Record<string, { label: string; cls: string }> = {
  High: { label: 'High', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  Medium: { label: 'Medium', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  Low: { label: 'Low', cls: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300' },
  Manual_Review_Required: {
    label: 'Manual review',
    cls: 'bg-truth-review/20 text-truth-review',
  },
};

export function InventoryList({ artifacts }: { artifacts: CodeArtifact[] }) {
  const { filter, setFilter, sort, setSort, selectedId, select, openBulk } =
    useMigrationStore();

  const filtered = useMemo(() => {
    let xs = artifacts;
    if (filter !== 'All') {
      xs = xs.filter((a) =>
        filter === 'Apex_Class'
          ? a.sourceType === 'Apex_Class' || a.sourceType === 'Apex_Trigger'
          : a.sourceType === filter,
      );
    }
    return [...xs].sort((a, b) => {
      if (sort === 'complexity') return b.complexityScore - a.complexityScore;
      if (sort === 'usage') {
        const order: Record<string, number> = {
          Confirmed_Usage: 0,
          Active_Or_Referenced: 1,
          Unknown: 2,
          Deprecated_Or_Inactive: 3,
        };
        return (order[a.usageSignal] ?? 99) - (order[b.usageSignal] ?? 99);
      }
      // confidence
      const cOrder: Record<string, number> = {
        Manual_Review_Required: 0,
        Low: 1,
        Medium: 2,
        High: 3,
      };
      return (cOrder[a.conversionConfidence] ?? 99) - (cOrder[b.conversionConfidence] ?? 99);
    });
  }, [artifacts, filter, sort]);

  const highCount = artifacts.filter((a) => a.conversionConfidence === 'High').length;

  return (
    <aside className="flex h-full w-[350px] shrink-0 flex-col border-r border-border bg-card">
      {/* Header — bulk draft CTA */}
      <div className="border-b border-border p-3">
        <button
          type="button"
          onClick={openBulk}
          disabled={highCount === 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 focus-ring disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          Bulk draft high-confidence ({highCount})
        </button>
      </div>

      {/* Filter chips */}
      <div className="border-b border-border p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Filter
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SOURCE_FILTER.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus-ring',
                filter === f
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted/50 text-foreground/80 hover:bg-muted',
              )}
            >
              {FILTER_LABEL[f]}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Sort:</span>
          {(['complexity', 'usage', 'confidence'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={cn(
                'capitalize transition-colors focus-ring',
                sort === s ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">
            No artifacts match the current filter.
          </p>
        )}
        <ul>
          {filtered.map((a) => {
            const isSelected = a.id === selectedId;
            const isManualReview = a.conversionConfidence === 'Manual_Review_Required';
            const isManualDesign = a.recommendedRcaTarget === 'Manual_Design_Required';
            const hasManualEmphasis = isManualReview || isManualDesign;

            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => select(a.id)}
                  className={cn(
                    'flex w-full flex-col gap-1.5 border-l-2 border-b border-border px-3 py-2.5 text-left transition-colors focus-ring',
                    isSelected
                      ? 'border-l-accent bg-accent/5'
                      : isManualDesign
                      ? 'border-l-severity-high bg-severity-high/5'
                      : isManualReview
                      ? 'border-l-truth-review bg-truth-review/5'
                      : 'border-l-transparent hover:bg-muted/30',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 text-sm font-medium leading-snug text-foreground">
                      {a.name}
                    </div>
                    {hasManualEmphasis && (
                      <span title={isManualDesign ? 'Manual design required' : 'Manual review required'}>
                        {isManualDesign ? (
                          <FileWarning className="h-3.5 w-3.5 shrink-0 text-severity-high" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-truth-review" />
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-muted-foreground">
                      {SOURCE_LABEL[a.sourceType]}
                    </span>
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        USAGE_DOT[a.usageSignal] ?? 'bg-muted-foreground',
                      )}
                      title={a.usageSignal}
                    />
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-medium',
                        CONFIDENCE_BADGE[a.conversionConfidence]?.cls ??
                          CONFIDENCE_BADGE.Medium.cls,
                      )}
                    >
                      {CONFIDENCE_BADGE[a.conversionConfidence]?.label ?? 'Medium'}
                    </span>
                  </div>

                  {/* Mini complexity bar */}
                  <div className="flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted/40">
                      <div
                        className="h-1 rounded-full bg-accent/70"
                        style={{ width: `${a.complexityScore}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {a.complexityScore}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
