import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SeverityBadge } from '@/components/shared/Badges';
import { EvidenceLink } from '@/components/shared/EvidenceLink';
import { TruthLabel } from '@/components/shared/TruthLabel';
import type { ImplementationFinding } from '@/types/assessment';

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

type Props = {
  finding: ImplementationFinding;
  /** Index within the category, used for stable in-page anchors. */
  index: number;
};

export function FindingCard({ finding, index }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <article
      id={`finding-${slug(finding.category)}-${index}`}
      className="rounded-lg border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <header className="flex items-start gap-3">
        <SeverityBadge severity={finding.severity} className="mt-0.5" />
        <h3 className="flex-1 text-base font-semibold leading-snug text-foreground">
          {finding.finding}
        </h3>
        <TruthLabel variant="ai_generated" className="shrink-0" />
      </header>

      <div className="mt-3 space-y-3 text-sm">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground focus-ring"
          aria-expanded={open}
        >
          <ChevronDown
            className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
            aria-hidden
          />
          {open ? 'Hide technical detail' : 'Show technical detail'}
        </button>
        {open && (
          <p className="rounded-md bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground/90">
            {finding.technicalDetail}
          </p>
        )}

        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recommended action
          </div>
          <p className="mt-1 text-foreground/90">{finding.recommendedAction}</p>
        </div>

        <EvidenceLink trail={finding.evidence} title={finding.finding} />
      </div>
    </article>
  );
}
