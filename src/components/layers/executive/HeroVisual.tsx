import { TruthLabel } from '@/components/shared/TruthLabel';
import type { AssessmentPayload } from '@/types/assessment';

type Props = {
  payload: AssessmentPayload;
};

const FRICTION_THRESHOLD = 50;

/**
 * Two-bar comparison: complexity dimensions that exceed mid-tier today
 * vs. RCA capabilities mapped to address them.
 *
 * Both bars trace to specific payload fields:
 *   Bar 1 = count of complexityScores.dimensions[*] where score > 50
 *   Bar 2 = rcaBenefitMapping.length
 *
 * The threshold (50) marks the boundary between Low and Medium complexity
 * tiers in the demo profile.
 */
export function HeroVisual({ payload }: Props) {
  const dimensionEntries = Object.entries(payload.complexityScores.dimensions) as Array<
    [string, AssessmentPayload['complexityScores']['dimensions'][keyof AssessmentPayload['complexityScores']['dimensions']]]
  >;
  const totalDimensions = dimensionEntries.length;
  const frictionDimensions = dimensionEntries.filter(([, d]) => d.score > FRICTION_THRESHOLD).length;
  const mappedCapabilities = payload.rcaBenefitMapping.length;
  const max = Math.max(frictionDimensions, mappedCapabilities, 1);

  const bars = [
    {
      label: 'Friction dimensions today',
      value: frictionDimensions,
      hint: `${frictionDimensions} of ${totalDimensions} complexity dimensions score above ${FRICTION_THRESHOLD}`,
    },
    {
      label: 'RCA capabilities mapped to address them',
      value: mappedCapabilities,
      hint: `${mappedCapabilities} entries in rcaBenefitMapping pair CPQ pain points with RCA capabilities`,
    },
  ];

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Where the org has friction — and what RCA brings to address it
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {frictionDimensions} of {totalDimensions} complexity dimensions exceed mid-tier today;{' '}
            {mappedCapabilities} mapped RCA capabilities address them.
          </p>
        </div>
        <TruthLabel variant="heuristic" />
      </header>

      <div className="space-y-4">
        {bars.map((b) => {
          const pct = (b.value / max) * 100;
          return (
            <div key={b.label}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="font-medium text-foreground">{b.label}</span>
                <span className="font-mono text-foreground">{b.value}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted">
                <div
                  className="h-3 rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${pct}%` }}
                  aria-label={`${b.label}: ${b.value} of ${max}`}
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{b.hint}</div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs italic text-muted-foreground">
        Sources: complexityScores.dimensions (count where score &gt; {FRICTION_THRESHOLD}),
        rcaBenefitMapping.length.
      </p>
    </section>
  );
}
