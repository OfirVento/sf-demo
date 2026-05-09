import { useState } from 'react';
import { Check, Copy, MessageCircleQuestion } from 'lucide-react';
import { TruthLabel } from '@/components/shared/TruthLabel';
import type { Concern } from '@/types/assessment';

function PromptCard({ concern }: { concern: Concern }) {
  const [copied, setCopied] = useState(false);
  const sales = concern.audienceFraming.sales;

  async function copy() {
    const text = `Discovery prompt — ${concern.title}\n\n${sales.headline}\n\nTalking point: ${sales.talkingPoint}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <article className="group rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md">
      <header className="mb-2 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <MessageCircleQuestion
            className="mt-0.5 h-4 w-4 shrink-0 text-accent"
            aria-hidden
          />
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ask the client about
          </span>
        </div>
        <button
          type="button"
          onClick={() => void copy()}
          className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-ring group-hover:opacity-100"
          aria-label={copied ? 'Copied' : 'Copy prompt'}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </header>
      <p className="text-sm font-medium text-foreground">{sales.headline}</p>
      <p className="mt-2 text-sm italic text-muted-foreground">{sales.talkingPoint}</p>
    </article>
  );
}

export function RiskPrompts({ concerns }: { concerns: Concern[] }) {
  return (
    <section className="space-y-4">
      <header className="flex items-start justify-between gap-3 border-b border-border pb-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Risks as conversation prompts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Each top concern reframed as something to ask the client about.
          </p>
        </div>
        <TruthLabel variant="ai_generated" />
      </header>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {concerns.map((c) => (
          <PromptCard key={c.id} concern={c} />
        ))}
      </div>
    </section>
  );
}
