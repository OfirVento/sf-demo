import { ConfidenceBadge } from '@/components/shared/Badges';
import { TruthLabel } from '@/components/shared/TruthLabel';
import type { AssessmentPayload } from '@/types/assessment';

type Props = { payload: AssessmentPayload };

export function TimeToValue({ payload }: Props) {
  const loe = payload.loeEstimate;
  // Source: rcaOpportunities.length. Must match the count of capability tiles
  // rendered by ExecutiveLayer's "RCA capabilities unlocked" grid.
  const moduleCount = payload.rcaOpportunities.length;

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <article className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Estimated migration
          </div>
          <TruthLabel variant="heuristic" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight text-foreground">
            {loe.weeksLow}–{loe.weeksHigh}
          </span>
          <span className="text-base text-muted-foreground">weeks</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <ConfidenceBadge confidence={loe.confidence} />
        </div>
      </article>

      <article className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            RCA capabilities live
          </div>
          <TruthLabel variant="heuristic" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight text-foreground">
            {moduleCount}
          </span>
          <span className="text-base text-muted-foreground">modules</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <ConfidenceBadge confidence="Medium" />
        </div>
      </article>
    </section>
  );
}
