import { cn } from '@/lib/utils';
import type { AssessmentPayload } from '@/types/assessment';

type Recommendation = AssessmentPayload['verdict']['recommendation'];

const STYLE: Record<Recommendation, { label: string; cls: string }> = {
  Proceed: { label: 'Proceed', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  Proceed_With_Caution: {
    label: 'Proceed with caution',
    cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  },
  Needs_Deeper_Discovery: {
    label: 'Needs deeper discovery',
    cls: 'bg-severity-high/15 text-severity-high',
  },
};

export function VerdictBadge({
  recommendation,
  className,
}: {
  recommendation: Recommendation;
  className?: string;
}) {
  const s = STYLE[recommendation];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold',
        s.cls,
        className,
      )}
    >
      {s.label}
    </span>
  );
}
