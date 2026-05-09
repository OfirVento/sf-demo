import { Link } from 'react-router-dom';
import { FileDown } from 'lucide-react';
import { useAssessmentStore } from '@/store/useAssessmentStore';
import { TruthLabel } from '@/components/shared/TruthLabel';
import { ReadinessHeader } from '@/components/layers/salesforce/ReadinessHeader';
import { ExpansionSignalsGrid } from '@/components/layers/salesforce/ExpansionSignalsGrid';
import { MigrationRiskHeatmap } from '@/components/layers/salesforce/MigrationRiskHeatmap';
import { CoSellNarrative } from '@/components/layers/salesforce/CoSellNarrative';

export function SalesforceLayer() {
  const payload = useAssessmentStore((s) => s.payload);
  if (!payload) return null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-12">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Revenue Cloud / Agentforce Revenue Management Readiness
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            Account-team view: readiness verdict, expansion signals, migration risk, co-sell.
          </p>
        </div>
        <TruthLabel variant="sample_data" />
      </div>

      {/* 1. Readiness verdict header */}
      <ReadinessHeader payload={payload} />

      {/* 2. Expansion signals grid */}
      <ExpansionSignalsGrid signals={payload.expansionSignals} />

      {/* 3. Migration risk profile (heatmap) */}
      <MigrationRiskHeatmap payload={payload} />

      {/* 4. Co-sell narrative */}
      <CoSellNarrative initial={payload.aiNarratives.salesforce} />

      {/* 5. Account-ready summary export */}
      <section className="space-y-4">
        <header className="border-b border-border pb-2">
          <h2 className="text-lg font-semibold text-foreground">Account-ready summary export</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate a printable one-page briefing for the Salesforce account team.
          </p>
        </header>
        <Link
          to="/assessment/salesforce/briefing"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 focus-ring"
        >
          <FileDown className="h-4 w-4" />
          Generate one-page Salesforce briefing
        </Link>
      </section>
    </div>
  );
}
