import { useAssessmentStore } from '@/store/useAssessmentStore';
import { VerdictBadge } from '@/components/shared/VerdictBadge';
import { LayerScaffold } from './LayerScaffold';

export function ExecutiveLayer() {
  const payload = useAssessmentStore((s) => s.payload);
  return (
    <LayerScaffold
      title="Executive view"
      subtitle="Verdict, top concerns, time-to-value framing."
      truthLabel="sample_data"
      milestone="M2 will populate the hero verdict, AI narrative, top concerns and RCA capability tiles."
    >
      {payload && (
        <div className="flex items-center gap-3">
          <VerdictBadge recommendation={payload.verdict.recommendation} />
          <span className="text-sm text-muted-foreground">{payload.verdict.rationale}</span>
        </div>
      )}
    </LayerScaffold>
  );
}
