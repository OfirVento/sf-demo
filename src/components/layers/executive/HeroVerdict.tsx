import { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VerdictBadge } from '@/components/shared/VerdictBadge';
import { TruthLabel } from '@/components/shared/TruthLabel';
import { regenerateNarrative } from '@/lib/llm/agent';
import { useAssessmentStore } from '@/store/useAssessmentStore';
import type { AssessmentPayload } from '@/types/assessment';

type Props = {
  verdict: AssessmentPayload['verdict'];
  narrative: string;
};

export function HeroVerdict({ verdict, narrative: initialNarrative }: Props) {
  const [hovered, setHovered] = useState(false);
  const [narrative, setNarrative] = useState(initialNarrative);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const payload = useAssessmentStore((s) => s.payload);

  async function reroll() {
    if (!payload || regenerating) return;
    setError(null);
    setRegenerating(true);
    try {
      const next = await regenerateNarrative({ payload, layer: 'executive' });
      if (next.trim()) setNarrative(next.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <section
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative space-y-6"
    >
      <div className="flex items-center gap-3">
        <VerdictBadge recommendation={verdict.recommendation} className="px-4 py-1.5 text-base" />
        <TruthLabel variant="ai_generated" />
      </div>

      <div className="relative">
        <p className="max-w-3xl text-2xl font-normal leading-relaxed text-foreground">
          {regenerating ? (
            <span className="text-muted-foreground">Regenerating narrative…</span>
          ) : (
            narrative
          )}
        </p>
        {error && (
          <p className="mt-2 text-sm text-severity-high" role="alert">
            Re-roll failed: {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => void reroll()}
          disabled={regenerating}
          title="Re-roll narrative"
          className={cn(
            'absolute -top-2 right-0 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground transition-opacity duration-200 hover:text-foreground focus-ring',
            hovered || regenerating ? 'opacity-100' : 'opacity-0',
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
          aria-label="Re-roll narrative"
        >
          <RotateCw className={cn('h-3 w-3', regenerating && 'animate-spin')} aria-hidden />
          {regenerating ? 'Re-rolling' : 'Re-roll'}
        </button>
      </div>
    </section>
  );
}
