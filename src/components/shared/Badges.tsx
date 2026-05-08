import { cn } from '@/lib/utils';
import type { ConfidenceLevel, DraftConfidence, Severity } from '@/types/assessment';

const SEVERITY: Record<Severity, string> = {
  Info: 'bg-severity-info/15 text-severity-info',
  Low: 'bg-severity-low/20 text-severity-low',
  Medium: 'bg-severity-medium/15 text-severity-medium',
  High: 'bg-severity-high/15 text-severity-high',
  Critical: 'bg-severity-critical/15 text-severity-critical',
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        SEVERITY[severity],
        className,
      )}
    >
      {severity}
    </span>
  );
}

const CONFIDENCE: Record<DraftConfidence, { label: string; cls: string }> = {
  High: { label: 'High confidence', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  Medium: { label: 'Medium confidence', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  Low: { label: 'Low confidence', cls: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300' },
  Manual_Review_Required: {
    label: 'Manual review required',
    cls: 'bg-truth-review/20 text-truth-review',
  },
};

export function ConfidenceBadge({
  confidence,
  className,
}: {
  confidence: DraftConfidence | ConfidenceLevel;
  className?: string;
}) {
  const c = CONFIDENCE[confidence as DraftConfidence] ?? CONFIDENCE.Medium;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        c.cls,
        className,
      )}
    >
      {c.label}
    </span>
  );
}
