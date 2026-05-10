import { useEffect, useMemo } from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { useMigrationStore } from '@/store/useMigrationStore';
import type { CodeArtifact } from '@/types/assessment';

export function BulkDraftModal({ artifacts }: { artifacts: CodeArtifact[] }) {
  const { bulkOpen, bulkProgress, closeBulk, startBulk } = useMigrationStore();

  const candidates = useMemo(
    () => artifacts.filter((a) => a.conversionConfidence === 'High'),
    [artifacts],
  );

  // Reset progress on open.
  useEffect(() => {
    if (!bulkOpen) return;
    // intentionally empty — startBulk creates progress when triggered
  }, [bulkOpen]);

  if (!bulkOpen) return null;

  const pct = bulkProgress
    ? Math.round((bulkProgress.done / Math.max(1, bulkProgress.total)) * 100)
    : 0;
  const inProgress = !!bulkProgress && bulkProgress.done < bulkProgress.total;
  const complete = !!bulkProgress && bulkProgress.done === bulkProgress.total;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-label="Bulk draft">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/30"
        aria-label="Close"
        onClick={() => !inProgress && closeBulk()}
      />
      <div className="relative w-full max-w-md rounded-lg border border-border bg-card shadow-xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="text-base font-semibold text-foreground">Bulk draft eligible artifacts</h2>
          </div>
          {!inProgress && (
            <button
              type="button"
              onClick={closeBulk}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-ring"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </header>

        <div className="space-y-4 px-5 py-4 text-sm">
          {!bulkProgress && (
            <>
              <p className="text-foreground/90">
                Generate migration drafts for{' '}
                <span className="font-semibold text-foreground">{candidates.length}</span>{' '}
                high-confidence candidate{candidates.length === 1 ? '' : 's'}. Manual-review
                artifacts are intentionally excluded — they require human judgement and are kept as
                the demo's honesty signals.
              </p>
              <ul className="max-h-48 overflow-y-auto rounded-md border border-border bg-muted/20 p-2 text-xs">
                {candidates.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-2 px-2 py-1.5"
                  >
                    <span className="truncate text-foreground/85">{a.name}</span>
                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                      High
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {bulkProgress && (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-muted-foreground">
                  {complete ? 'Complete' : `Drafting ${bulkProgress.done} of ${bulkProgress.total}…`}
                </span>
                <span className="font-mono text-foreground">{pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {complete && (
                <p className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  All {bulkProgress.total} drafts generated. Open any artifact to review.
                </p>
              )}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          {!bulkProgress && (
            <>
              <button
                type="button"
                onClick={closeBulk}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-ring"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void startBulk(candidates)}
                disabled={candidates.length === 0}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90 focus-ring disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Draft {candidates.length} artifact{candidates.length === 1 ? '' : 's'}
              </button>
            </>
          )}
          {complete && (
            <button
              type="button"
              onClick={closeBulk}
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90 focus-ring"
            >
              Close
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
