import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TruthLabel } from '@/components/shared/TruthLabel';
import type { TalkingPoint, TalkingPointContext } from '@/types/assessment';

const CONTEXT_LABEL: Record<TalkingPointContext, string> = {
  discovery_call: 'Discovery call',
  sow_review: 'SOW review',
  executive_meeting: 'Executive meeting',
  salesforce_handoff: 'Salesforce handoff',
};

const CONTEXT_COLOR: Record<TalkingPointContext, string> = {
  discovery_call: 'bg-accent/10 text-accent',
  sow_review: 'bg-severity-medium/15 text-severity-medium',
  executive_meeting: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  salesforce_handoff: 'bg-truth-sample/10 text-truth-sample',
};

function PointCard({ tp }: { tp: TalkingPoint }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = `${tp.point}\n\nSupporting data: ${tp.supportingData}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard write can fail in restricted contexts; ignore silently.
    }
  }

  return (
    <article className="group rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md">
      <header className="mb-2 flex items-start justify-between gap-3">
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            CONTEXT_COLOR[tp.context],
          )}
        >
          {CONTEXT_LABEL[tp.context]}
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-ring group-hover:opacity-100"
          aria-label={copied ? 'Copied' : 'Copy talking point'}
          title={copied ? 'Copied' : 'Copy point + supporting data'}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </header>
      <p className="text-sm text-foreground/95">{tp.point}</p>
      <p className="mt-2 text-xs italic text-muted-foreground">
        {tp.supportingData}
      </p>
    </article>
  );
}

export function TalkingPointsBlock({ points }: { points: TalkingPoint[] }) {
  return (
    <section className="space-y-4">
      <header className="flex items-start justify-between gap-3 border-b border-border pb-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            What to say on the discovery call
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            AE-scoped talking points with the supporting data line for each.
          </p>
        </div>
        <TruthLabel variant="ai_generated" />
      </header>
      <div className="space-y-3">
        {points.map((tp, i) => (
          <PointCard key={i} tp={tp} />
        ))}
      </div>
    </section>
  );
}
