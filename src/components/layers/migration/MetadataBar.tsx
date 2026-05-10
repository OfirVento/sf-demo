import { AlertTriangle, FileWarning, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TruthLabel } from '@/components/shared/TruthLabel';
import { EvidenceLink } from '@/components/shared/EvidenceLink';
import type { CodeArtifact, RcaTargetPattern } from '@/types/assessment';

const TARGET_LABEL: Record<RcaTargetPattern, string> = {
  Pricing_Procedure: 'Pricing Procedure',
  Price_Adjustment_Method: 'Price Adjustment Method',
  CML_Constraint: 'CML Constraint',
  CML_Relationship: 'CML Relationship',
  Declarative_Configuration: 'Declarative Configuration',
  Flow_Extension: 'Flow Extension',
  Apex_Invocable_Extension: 'Apex Invocable Extension',
  Manual_Design_Required: 'Manual Design Required',
};

const CONFIDENCE_STYLE: Record<string, string> = {
  High: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  Medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  Low: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300',
  Manual_Review_Required: 'bg-truth-review/20 text-truth-review',
};

export function MetadataBar({ artifact }: { artifact: CodeArtifact }) {
  const isManualDesign = artifact.recommendedRcaTarget === 'Manual_Design_Required';
  const isManualReview = artifact.conversionConfidence === 'Manual_Review_Required';

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border bg-card/60 px-5 py-3 backdrop-blur">
      {/* Confidence */}
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
          CONFIDENCE_STYLE[artifact.conversionConfidence],
        )}
      >
        {artifact.conversionConfidence === 'Manual_Review_Required'
          ? 'Manual review'
          : `${artifact.conversionConfidence} confidence`}
      </span>

      {/* Target pattern */}
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
          isManualDesign
            ? 'bg-severity-high/15 text-severity-high ring-1 ring-severity-high/30'
            : 'bg-muted/60 text-foreground/85',
        )}
      >
        {isManualDesign && <FileWarning className="h-3 w-3" aria-hidden />}
        Target: {TARGET_LABEL[artifact.recommendedRcaTarget]}
      </span>

      {/* Human review required */}
      {artifact.draft.humanReviewRequired && (
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-truth-review/15 px-2.5 py-0.5 text-xs font-medium text-truth-review"
          title={artifact.draft.reviewReasons.join(' • ')}
        >
          <ShieldAlert className="h-3 w-3" aria-hidden />
          Human review required
        </span>
      )}

      {/* Truth label */}
      <TruthLabel variant="ai_generated" />

      <div className="ml-auto flex items-center gap-3">
        {(isManualDesign || isManualReview) && (
          <span className="inline-flex items-center gap-1 text-xs text-truth-review">
            <AlertTriangle className="h-3 w-3" aria-hidden />
            Honesty signal
          </span>
        )}
        <EvidenceLink trail={artifact.evidence} title={artifact.name} />
      </div>
    </div>
  );
}
