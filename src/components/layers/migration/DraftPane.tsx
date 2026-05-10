import { useState } from 'react';
import { Bookmark, Check, RotateCw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CodeBlock } from '@/components/shared/CodeBlock';
import { useMigrationStore } from '@/store/useMigrationStore';
import type { CodeArtifact } from '@/types/assessment';

type Tab = 'draft' | 'reasoning' | 'tests';

const TAB_LABEL: Record<Tab, string> = {
  draft: 'Draft',
  reasoning: 'Reasoning',
  tests: 'Tests',
};

export function DraftPane({ artifact }: { artifact: CodeArtifact }) {
  const [tab, setTab] = useState<Tab>('draft');
  const { generation, generate, regenerate, marked, markForReview } = useMigrationStore();
  const state = generation[artifact.id] ?? 'not_started';

  // Skeleton state — Generate CTA centered.
  if (state === 'not_started') {
    return (
      <section className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-2 text-xs">
          <span className="font-semibold uppercase tracking-wide text-muted-foreground">
            Generated RCA migration draft
          </span>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="rounded-full bg-accent/10 p-4">
            <Sparkles className="h-6 w-6 text-accent" />
          </div>
          <div className="space-y-1.5">
            <p className="text-base font-medium text-foreground">Ready to draft</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Generate a migration candidate for this artifact. The draft includes target pattern
              reasoning, preserved/changed behaviour, and required test scenarios.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void generate(artifact.id)}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 focus-ring"
          >
            <Sparkles className="h-4 w-4" />
            Generate RCA Draft
          </button>
        </div>
      </section>
    );
  }

  // Loading — animated skeleton.
  if (state === 'loading') {
    return (
      <section className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-2 text-xs">
          <span className="font-semibold uppercase tracking-wide text-muted-foreground">
            Generating draft…
          </span>
        </header>
        <div className="flex-1 space-y-3 p-5">
          <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-32 animate-pulse rounded bg-muted/60" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
        </div>
      </section>
    );
  }

  const draft = artifact.draft;

  return (
    <section className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-2 text-xs">
        <span className="font-semibold uppercase tracking-wide text-muted-foreground">
          Generated RCA migration draft
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => markForReview(artifact.id)}
            className={cn(
              'inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors focus-ring',
              marked[artifact.id]
                ? 'bg-truth-review/15 text-truth-review'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {marked[artifact.id] ? (
              <Check className="h-3 w-3" />
            ) : (
              <Bookmark className="h-3 w-3" />
            )}
            {marked[artifact.id] ? 'Marked' : 'Mark for review'}
          </button>
          <button
            type="button"
            onClick={() => void regenerate(artifact.id)}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-ring"
          >
            <RotateCw className="h-3 w-3" />
            Re-generate
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="flex border-b border-border bg-card/40 px-2">
        {(['draft', 'reasoning', 'tests'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'border-b-2 px-3 py-2 text-sm transition-colors focus-ring',
              tab === t
                ? 'border-accent text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-auto p-4">
        {tab === 'draft' && (
          <div className="space-y-4">
            <CodeBlock code={draft.generatedCandidate} language={draft.candidateLanguage} />
            <p className="text-sm leading-relaxed text-foreground/85">
              {draft.plainLanguageExplanation}
            </p>
          </div>
        )}

        {tab === 'reasoning' && (
          <div className="space-y-5 text-sm">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Why this target pattern
              </div>
              <p className="text-foreground/90">{draft.targetPatternReasoning}</p>
            </div>
            {draft.preservedBehavior.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Preserved behaviour
                </div>
                <ul className="list-disc space-y-1 pl-5 text-foreground/90">
                  {draft.preservedBehavior.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
            {draft.changedBehavior.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Changed behaviour
                </div>
                <ul className="list-disc space-y-1 pl-5 text-foreground/90">
                  {draft.changedBehavior.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
            {draft.unknowns.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Unknowns
                </div>
                <ul className="list-disc space-y-1 pl-5 text-foreground/90">
                  {draft.unknowns.map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              </div>
            )}
            {draft.humanReviewRequired && draft.reviewReasons.length > 0 && (
              <div className="rounded-md border border-truth-review/30 bg-truth-review/5 p-3">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-truth-review">
                  Why human review is required
                </div>
                <ul className="list-disc space-y-1 pl-5 text-foreground/90">
                  {draft.reviewReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {tab === 'tests' && (
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Required test scenarios ({draft.requiredTests.length})
            </div>
            <ul className="space-y-2 text-sm">
              {draft.requiredTests.map((t, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-md border border-border bg-muted/20 p-2.5"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-accent"
                    aria-label={`Test ${i + 1}`}
                  />
                  <span className="text-foreground/90">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
