import { ConfidenceBadge } from '@/components/shared/Badges';
import { EvidenceLink } from '@/components/shared/EvidenceLink';
import { TruthLabel } from '@/components/shared/TruthLabel';
import type { ExpansionModule, ExpansionSignal } from '@/types/assessment';

const MODULE_LABEL: Record<ExpansionModule, string> = {
  DRO: 'Dynamic Revenue Orchestrator',
  Billing: 'Revenue Cloud Billing',
  Advanced_Approvals: 'Advanced Approvals',
  Usage_Management: 'Usage Management',
  Revenue_Recognition: 'Revenue Recognition',
  CLM: 'Contract Lifecycle Management',
  Product_Discovery: 'Product Discovery',
  Token_Overage: 'Token Overage Detection',
  Agentforce: 'Agentforce for Revenue Management',
};

function SignalCard({ signal }: { signal: ExpansionSignal }) {
  return (
    <article
      className="group rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
      title={`Trigger: ${signal.triggerCondition}`}
    >
      <header className="mb-2 flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold leading-snug text-foreground">
          {MODULE_LABEL[signal.module]}
        </h3>
        <ConfidenceBadge confidence={signal.confidence} className="shrink-0 text-[10px]" />
      </header>
      <p className="text-sm italic text-foreground/85">{signal.consultativeFraming}</p>
      <p className="mt-3 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        <span className="font-medium">Trigger:</span> {signal.triggerCondition}
      </p>
      <div className="mt-3">
        <EvidenceLink trail={signal.evidence} title={MODULE_LABEL[signal.module]} />
      </div>
    </article>
  );
}

export function ExpansionSignalsGrid({ signals }: { signals: ExpansionSignal[] }) {
  return (
    <section className="space-y-4">
      <header className="flex items-start justify-between gap-3 border-b border-border pb-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Expansion signals</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Modules surface only when triggered by something in the org scan. Empty grid is fine.
          </p>
        </div>
        <TruthLabel variant="ai_generated" />
      </header>
      {signals.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          No expansion signals triggered for this account.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {signals.map((s) => (
            <SignalCard key={s.module} signal={s} />
          ))}
        </div>
      )}
    </section>
  );
}
