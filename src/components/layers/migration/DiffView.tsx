import { Check, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CodeArtifact } from '@/types/assessment';

/** Side-by-side preserved/transformed/deprecated view of a single artifact. */
export function DiffView({ artifact }: { artifact: CodeArtifact }) {
  const draft = artifact.draft;

  return (
    <div className="grid h-full grid-cols-2 divide-x divide-border">
      <section className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-2 text-xs">
          <span className="font-semibold uppercase tracking-wide text-muted-foreground">
            CPQ behaviour today
          </span>
          <span className="rounded bg-severity-medium/15 px-2 py-0.5 text-[10px] font-medium text-severity-medium">
            Source of truth
          </span>
        </header>
        <div className="flex-1 space-y-3 overflow-auto p-5 text-sm">
          <p className="font-medium text-foreground">{artifact.businessPurpose}</p>
          {draft.preservedBehavior.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Behaviour observed today
              </div>
              <ul className="space-y-1.5 text-foreground/90">
                {draft.preservedBehavior.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500"
                      aria-hidden
                    />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-2 text-xs">
          <span className="font-semibold uppercase tracking-wide text-muted-foreground">
            Behaviour after migration to RCA
          </span>
          <span className="rounded bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
            Generated draft
          </span>
        </header>
        <div className="flex-1 space-y-4 overflow-auto p-5 text-sm">
          {draft.preservedBehavior.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                Preserved
              </div>
              <ul className="space-y-1.5 text-foreground/90">
                {draft.preservedBehavior.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500"
                      aria-hidden
                    />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {draft.changedBehavior.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
                Transformed
              </div>
              <ul className="space-y-1.5 text-foreground/90">
                {draft.changedBehavior.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Plus className={cn('mt-0.5 h-3.5 w-3.5 shrink-0 text-accent')} aria-hidden />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {draft.unknowns.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-truth-review">
                Unknown / requires review
              </div>
              <ul className="space-y-1.5 text-foreground/90">
                {draft.unknowns.map((u, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-truth-review" aria-hidden />
                    {u}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
