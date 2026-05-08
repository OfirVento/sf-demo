import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEvidenceDrawerStore } from '@/store/useEvidenceDrawerStore';

type Tab = 'summary' | 'detailed' | 'raw';

export function EvidenceDrawer() {
  const { open, title, trail, close } = useEvidenceDrawerStore();
  const [tab, setTab] = useState<Tab>('summary');

  if (!open || !trail) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label="Evidence drawer">
      <button
        type="button"
        aria-label="Close evidence drawer"
        className="absolute inset-0 bg-foreground/20"
        onClick={close}
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md border-l border-border bg-card shadow-xl transition-transform duration-300 ease-out">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Evidence</h2>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded p-1 text-muted-foreground hover:bg-muted focus-ring"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <nav className="flex border-b border-border px-6 text-sm">
          {(['summary', 'detailed', 'raw'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'border-b-2 px-3 py-3 capitalize transition-colors',
                tab === t
                  ? 'border-accent text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t}
            </button>
          ))}
        </nav>

        <div className="overflow-y-auto px-6 py-5 text-sm" style={{ maxHeight: 'calc(100% - 9rem)' }}>
          {tab === 'summary' && (
            <ul className="list-disc space-y-2 pl-4 text-foreground/90">
              {trail.summary.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}
          {tab === 'detailed' && (
            <div className="space-y-3">
              {trail.detailed.length === 0 && (
                <p className="text-muted-foreground">No detailed metrics available.</p>
              )}
              {trail.detailed.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-border/60 pb-2 last:border-b-0"
                >
                  <div>
                    <div className="font-medium text-foreground">{row.metric}</div>
                    <div className="text-xs text-muted-foreground">{row.source}</div>
                  </div>
                  <div className="font-mono text-sm text-foreground">{String(row.value)}</div>
                </div>
              ))}
            </div>
          )}
          {tab === 'raw' && (
            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="mb-1 text-muted-foreground">artifactReferences</div>
                {trail.raw.artifactReferences.length === 0 ? (
                  <div className="text-muted-foreground">[]</div>
                ) : (
                  <ul className="space-y-1">
                    {trail.raw.artifactReferences.map((r, i) => (
                      <li key={i} className="rounded bg-muted px-2 py-1">
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {trail.raw.metadataExtracts && (
                <div>
                  <div className="mb-1 text-muted-foreground">metadataExtracts</div>
                  <pre className="whitespace-pre-wrap rounded bg-muted p-3 text-foreground">
                    {JSON.stringify(trail.raw.metadataExtracts, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
