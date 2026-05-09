import { ArrowUpRight } from 'lucide-react';
import { useKbDrawerStore } from '@/store/useKbDrawerStore';
import { lookupKbCapability } from '@/lib/kb/capabilities';
import { ConfidenceBadge } from '@/components/shared/Badges';
import type { RcaOpportunity } from '@/types/assessment';

export function CapabilityTile({ opportunity }: { opportunity: RcaOpportunity }) {
  const showKb = useKbDrawerStore((s) => s.show);
  const kb = lookupKbCapability(opportunity.rcaCapability);

  return (
    <article className="flex h-full flex-col rounded-lg border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <header className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold leading-snug text-foreground">
          {opportunity.rcaCapability}
        </h3>
        <ConfidenceBadge confidence={opportunity.confidence} className="shrink-0 text-[10px]" />
      </header>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {opportunity.businessBenefit}
      </p>
      <button
        type="button"
        disabled={!kb}
        onClick={() => kb && showKb(kb)}
        className="mt-4 inline-flex items-center gap-1 self-start text-sm text-accent hover:underline focus-ring disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
      >
        Learn more
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      </button>
    </article>
  );
}
