import { useAssessmentStore } from '@/store/useAssessmentStore';
import { PayloadTruthLabel } from "@/components/shared/PayloadTruthLabel";
import { TalkingPointsBlock } from '@/components/layers/sales/TalkingPointsBlock';
import { ChartCard } from '@/components/layers/sales/ChartCard';
import {
  ComplexityChart,
  LoePhaseChart,
  OpportunityDonut,
  SeverityTiles,
} from '@/components/layers/sales/charts';
import { LoeSection } from '@/components/layers/sales/LoeSection';
import { RiskPrompts } from '@/components/layers/sales/RiskPrompts';

export function SalesLayer() {
  const payload = useAssessmentStore((s) => s.payload);
  if (!payload) return null;

  const overallScore = payload.complexityScores.overallNumeric;
  const phaseCount = payload.loeEstimate.suggestedPhases.length;
  const concernCount = payload.topConcerns.length;
  const oppCount = payload.rcaOpportunities.length;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-12">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sales view</h1>
          <p className="mt-1 text-base text-muted-foreground">
            Talking points, screenshot-ready charts, and LOE / SOW scaffolding.
          </p>
        </div>
        <PayloadTruthLabel />
      </div>

      {/* Talking points (left) + chart cards (right) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <TalkingPointsBlock points={payload.salesTalkingPoints} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ChartCard
            title="Complexity by dimension"
            takeaway={`Overall complexity is ${overallScore}/100. Pricing logic and custom code lead; deprecated config is the lightest lift.`}
            truthLabel="heuristic"
          >
            <ComplexityChart payload={payload} />
          </ChartCard>

          <ChartCard
            title="LOE breakdown by phase"
            takeaway={`${phaseCount} phases over ${payload.loeEstimate.weeksLow}–${payload.loeEstimate.weeksHigh} weeks; Migration Build is the largest band.`}
            truthLabel="heuristic"
          >
            <LoePhaseChart payload={payload} />
          </ChartCard>

          <ChartCard
            title="Top concerns by severity"
            takeaway={`${concernCount} concerns in scope. The two High-severity items concentrate around pricing translation and amendment logic.`}
            truthLabel="ai_generated"
          >
            <SeverityTiles payload={payload} />
          </ChartCard>

          <ChartCard
            title="RCA opportunities by category"
            takeaway={`${oppCount} opportunities — preserved benefits plus expansion signals across DRO, Billing, Advanced Approvals, Revenue Recognition, and Agentforce.`}
            truthLabel="ai_generated"
          >
            <OpportunityDonut payload={payload} />
          </ChartCard>
        </div>
      </div>

      {/* LOE / Scoping (full width) */}
      <LoeSection payload={payload} />

      {/* Risks as conversation prompts */}
      <RiskPrompts concerns={payload.topConcerns} />
    </div>
  );
}
