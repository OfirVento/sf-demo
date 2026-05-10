import { useAssessmentStore } from '@/store/useAssessmentStore';
import { PayloadTruthLabel } from "@/components/shared/PayloadTruthLabel";
import { HeroVerdict } from '@/components/layers/executive/HeroVerdict';
import { HeroVisual } from '@/components/layers/executive/HeroVisual';
import { ConcernCard } from '@/components/layers/executive/ConcernCard';
import { CapabilityTile } from '@/components/layers/executive/CapabilityTile';
import { TimeToValue } from '@/components/layers/executive/TimeToValue';

export function ExecutiveLayer() {
  const payload = useAssessmentStore((s) => s.payload);
  if (!payload) return null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 space-y-16">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Executive view</h1>
          <p className="mt-1 text-base text-muted-foreground">
            Verdict, top concerns, time-to-value framing.
          </p>
        </div>
        <PayloadTruthLabel />
      </div>

      {/* 1. Hero verdict block */}
      <HeroVerdict verdict={payload.verdict} narrative={payload.aiNarratives.executive} />

      {/* 2. Hero visual */}
      <HeroVisual payload={payload} />

      {/* 3. Top concerns */}
      <section className="space-y-4">
        <header className="flex items-baseline justify-between border-b border-border pb-2">
          <h2 className="text-lg font-semibold text-foreground">Top concerns</h2>
          <span className="text-xs text-muted-foreground">
            {payload.topConcerns.length} concerns
          </span>
        </header>
        <div className="space-y-3">
          {payload.topConcerns.map((c) => (
            <ConcernCard key={c.id} concern={c} />
          ))}
        </div>
      </section>

      {/* 4. RCA capabilities unlocked */}
      <section className="space-y-4">
        <header className="flex items-baseline justify-between border-b border-border pb-2">
          <h2 className="text-lg font-semibold text-foreground">RCA capabilities unlocked</h2>
          <span className="text-xs text-muted-foreground">
            {payload.rcaOpportunities.length} capabilities
          </span>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {payload.rcaOpportunities.map((o) => (
            <CapabilityTile key={o.id} opportunity={o} />
          ))}
        </div>
      </section>

      {/* 5. Time-to-value */}
      <section className="space-y-4">
        <header className="flex items-baseline justify-between border-b border-border pb-2">
          <h2 className="text-lg font-semibold text-foreground">Time-to-value</h2>
        </header>
        <TimeToValue payload={payload} />
      </section>
    </div>
  );
}
