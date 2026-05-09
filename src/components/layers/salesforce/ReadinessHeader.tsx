import { cn } from '@/lib/utils';
import { TruthLabel } from '@/components/shared/TruthLabel';
import type { AssessmentPayload } from '@/types/assessment';

type Recommendation = AssessmentPayload['verdict']['recommendation'];
type ReadinessTier = 'Ready' | 'Needs preparation' | 'Not ready';

const READINESS_FROM_VERDICT: Record<Recommendation, ReadinessTier> = {
  Proceed: 'Ready',
  Proceed_With_Caution: 'Needs preparation',
  Needs_Deeper_Discovery: 'Not ready',
};

const READINESS_STYLE: Record<ReadinessTier, string> = {
  Ready: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/30',
  'Needs preparation':
    'bg-severity-medium/15 text-severity-medium ring-1 ring-severity-medium/30',
  'Not ready': 'bg-severity-high/15 text-severity-high ring-1 ring-severity-high/30',
};

export function ReadinessHeader({ payload }: { payload: AssessmentPayload }) {
  const tier = READINESS_FROM_VERDICT[payload.verdict.recommendation];
  const lo = payload.loeEstimate.weeksLow;
  const hi = payload.loeEstimate.weeksHigh;

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Account
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {payload.meta.orgName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Discovery completed in minutes. SI-ready in <span className="font-medium text-foreground">{lo}–{hi} weeks</span>.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <TruthLabel variant="ai_generated" />
          <span
            className={cn(
              'inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold',
              READINESS_STYLE[tier],
            )}
          >
            {tier}
          </span>
        </div>
      </div>
    </section>
  );
}
