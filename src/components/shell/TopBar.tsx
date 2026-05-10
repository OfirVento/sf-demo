import { Link } from 'react-router-dom';
import { useAssessmentStore } from '@/store/useAssessmentStore';
import { TruthLabel, type TruthLabelVariant } from '@/components/shared/TruthLabel';
import { GuidedWorkflowTrigger } from '@/components/shared/GuidedWorkflow';
import { LayerSwitcher } from './LayerSwitcher';
import { ThemeToggle } from './ThemeToggle';

const TRUTH_MAP: Record<string, TruthLabelVariant> = {
  real_org_data: 'real_org_data',
  sample_data: 'sample_data',
};

export function TopBar() {
  const payload = useAssessmentStore((s) => s.payload);
  const variant: TruthLabelVariant = payload ? TRUTH_MAP[payload.meta.truthLabel] : 'sample_data';

  return (
    <header
      data-no-print="true"
      className="flex h-14 items-center justify-between border-b border-border bg-card/90 px-6 backdrop-blur"
    >
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 focus-ring">
          <img src="/vento.svg" alt="Vento" className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-tight text-foreground">Vento</span>
          <span className="text-sm text-muted-foreground">CPQ → RCA Assessment</span>
        </Link>
        {payload && (
          <span className="hidden text-sm text-muted-foreground md:inline">
            · {payload.meta.orgName}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <LayerSwitcher />
        <TruthLabel variant={variant} />
        <GuidedWorkflowTrigger />
        <ThemeToggle />
      </div>
    </header>
  );
}
