import { useAssessmentStore } from '@/store/useAssessmentStore';
import { TruthLabel, type TruthLabelVariant } from './TruthLabel';

/**
 * Page-level truth label that derives its variant from the loaded payload's
 * `meta.truthLabel`. Use this on every layer's page header so a single
 * payload field flips both the top bar and the page header consistently.
 */
const VARIANT_FROM_META: Record<string, TruthLabelVariant> = {
  real_org_data: 'real_org_data',
  sample_data: 'sample_data',
};

export function PayloadTruthLabel({ className }: { className?: string }) {
  const truthLabel = useAssessmentStore((s) => s.payload?.meta.truthLabel);
  const variant: TruthLabelVariant = truthLabel
    ? VARIANT_FROM_META[truthLabel]
    : 'sample_data';
  return <TruthLabel variant={variant} className={className} />;
}
