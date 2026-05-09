import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EvidenceLink } from '@/components/shared/EvidenceLink';
import { TruthLabel } from '@/components/shared/TruthLabel';
import type { Concern, Severity } from '@/types/assessment';

const SEVERITY_DOT: Record<Severity, string> = {
  Info: 'bg-severity-info',
  Low: 'bg-severity-low',
  Medium: 'bg-severity-medium',
  High: 'bg-severity-high',
  Critical: 'bg-severity-critical',
};

export function ConcernCard({ concern }: { concern: Concern }) {
  const [open, setOpen] = useState(false);
  const f = concern.audienceFraming.executive;

  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 text-left focus-ring"
        aria-expanded={open}
      >
        <span
          className={cn('mt-2 h-2.5 w-2.5 shrink-0 rounded-full', SEVERITY_DOT[concern.severity])}
          aria-label={`Severity: ${concern.severity}`}
        />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold leading-snug text-foreground">{f.headline}</h3>
            <TruthLabel variant="ai_generated" className="shrink-0" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{f.impact}</p>
        </div>
        <ChevronDown
          className={cn(
            'mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div className="mt-4 space-y-3 border-t border-border pt-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Next action
            </div>
            <p className="mt-1 text-sm text-foreground/90">{f.nextAction}</p>
          </div>
          <EvidenceLink trail={concern.evidence} title={concern.title} />
        </div>
      )}

      {!open && (
        <div className="mt-4">
          <EvidenceLink trail={concern.evidence} title={concern.title} />
        </div>
      )}
    </article>
  );
}
