import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';
import type {
  AssessmentPayload,
  Severity,
} from '@/types/assessment';

const ACCENT = 'hsl(var(--accent))';
const MUTED_FG = 'hsl(var(--muted-foreground))';

const SEVERITY_HSL: Record<Severity, string> = {
  Info: 'hsl(var(--severity-info))',
  Low: 'hsl(var(--severity-low))',
  Medium: 'hsl(var(--severity-medium))',
  High: 'hsl(var(--severity-high))',
  Critical: 'hsl(var(--severity-critical))',
};

const DIMENSION_LABEL: Record<string, string> = {
  pricingLogic: 'Pricing logic',
  productCatalog: 'Product catalog',
  customCode: 'Custom code',
  dataMigration: 'Data migration',
  integrations: 'Integrations',
  deprecatedConfig: 'Deprecated config',
};

// ---------------------------------------------------------------------------
// 1. Complexity by dimension — grouped bar
// ---------------------------------------------------------------------------

export function ComplexityChart({ payload }: { payload: AssessmentPayload }) {
  const data = Object.entries(payload.complexityScores.dimensions).map(([k, v]) => ({
    name: DIMENSION_LABEL[k] ?? k,
    score: v.score,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="name"
          tick={{ fill: MUTED_FG, fontSize: 11 }}
          interval={0}
          angle={-22}
          textAnchor="end"
          height={48}
        />
        <YAxis domain={[0, 100]} tick={{ fill: MUTED_FG, fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            fontSize: 12,
          }}
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
        />
        <Bar dataKey="score" fill={ACCENT} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// 2. LOE by phase — stacked horizontal bar (per-phase low/high range)
// ---------------------------------------------------------------------------

export function LoePhaseChart({ payload }: { payload: AssessmentPayload }) {
  const data = payload.loeEstimate.suggestedPhases.map((p) => ({
    name: p.name,
    low: p.durationWeeks.low,
    extra: Math.max(0, p.durationWeeks.high - p.durationWeeks.low),
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 24, left: 32, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: MUTED_FG, fontSize: 11 }}
          label={{ value: 'Weeks', position: 'insideBottom', offset: -4, fill: MUTED_FG, fontSize: 11 }}
        />
        <YAxis type="category" dataKey="name" tick={{ fill: MUTED_FG, fontSize: 11 }} width={140} />
        <Tooltip
          formatter={(_, name, item) => {
            const d = item.payload as { low: number; extra: number };
            if (name === 'low') return [`${d.low}–${d.low + d.extra} weeks`, 'Range'];
            return [null, null];
          }}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            fontSize: 12,
          }}
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
        />
        <Bar dataKey="low" stackId="a" fill={ACCENT} />
        <Bar dataKey="extra" stackId="a" fill={ACCENT} fillOpacity={0.4} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// 3. Top concerns severity distribution — severity tiles
// ---------------------------------------------------------------------------

export function SeverityTiles({ payload }: { payload: AssessmentPayload }) {
  const counts: Record<Severity, number> = {
    Info: 0,
    Low: 0,
    Medium: 0,
    High: 0,
    Critical: 0,
  };
  for (const c of payload.topConcerns) counts[c.severity]++;
  const order: Severity[] = ['Critical', 'High', 'Medium', 'Low', 'Info'];

  return (
    <div className="grid grid-cols-5 gap-2">
      {order.map((sev) => {
        const n = counts[sev];
        const dim = n === 0;
        return (
          <div
            key={sev}
            className={cn(
              'flex flex-col items-center justify-center rounded-md border border-border p-3',
              dim ? 'bg-muted/30 opacity-50' : 'bg-card',
            )}
          >
            <span
              className="text-2xl font-semibold"
              style={{ color: dim ? MUTED_FG : SEVERITY_HSL[sev] }}
            >
              {n}
            </span>
            <span className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {sev}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. RCA opportunity count by category — donut
// ---------------------------------------------------------------------------

export function OpportunityDonut({ payload }: { payload: AssessmentPayload }) {
  // Categorise opportunities by whether they unlock an expansion module
  // (Salesforce upsell signal) or preserve an existing CPQ benefit.
  const buckets: Record<string, number> = {};
  for (const o of payload.rcaOpportunities) {
    const key = o.expansionSignal ? `Expansion · ${o.expansionSignal}` : 'Preserved benefit';
    buckets[key] = (buckets[key] ?? 0) + 1;
  }
  const data = Object.entries(buckets).map(([name, value]) => ({ name, value }));

  // Stable palette derived from the design tokens; order doesn't matter
  // because each segment is labeled.
  const PALETTE = [
    'hsl(var(--accent))',
    'hsl(var(--severity-info))',
    'hsl(var(--severity-low))',
    'hsl(var(--severity-medium))',
    'hsl(var(--severity-high))',
    'hsl(var(--truth-ai))',
    'hsl(var(--truth-real))',
  ];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={45}
          outerRadius={75}
          paddingAngle={2}
          stroke="hsl(var(--card))"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            fontSize: 12,
          }}
        />
        <Legend
          verticalAlign="bottom"
          align="center"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: MUTED_FG }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
