import { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TruthLabel } from '@/components/shared/TruthLabel';
import { regenerateNarrative } from '@/lib/llm/agent';
import { useAssessmentStore } from '@/store/useAssessmentStore';

export function CoSellNarrative({ initial }: { initial: string }) {
  const [text, setText] = useState(initial);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const payload = useAssessmentStore((s) => s.payload);

  async function reroll() {
    if (!payload || regenerating) return;
    setError(null);
    setRegenerating(true);
    try {
      const next = await regenerateNarrative({ payload, layer: 'salesforce' });
      if (next.trim()) setText(next.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <section className="space-y-4">
      <header className="flex items-start justify-between gap-3 border-b border-border pb-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Co-sell narrative</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            How AllCloud + Vento de-risk this migration for the Salesforce account team.
          </p>
        </div>
        <TruthLabel variant="ai_generated" />
      </header>
      <article className="relative rounded-lg border border-border bg-card p-6">
        <p className="max-w-3xl text-base leading-relaxed text-foreground/95">
          {regenerating ? (
            <span className="text-muted-foreground">Regenerating narrative…</span>
          ) : (
            text
          )}
        </p>
        {error && (
          <p className="mt-3 text-sm text-severity-high" role="alert">
            Re-roll failed: {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => void reroll()}
          disabled={regenerating}
          title="Re-roll narrative"
          className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground hover:text-foreground focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Re-roll narrative"
        >
          <RotateCw className={cn('h-3 w-3', regenerating && 'animate-spin')} aria-hidden />
          {regenerating ? 'Re-rolling' : 'Re-roll'}
        </button>
      </article>
    </section>
  );
}
