import { Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { useAssessmentStore } from '@/store/useAssessmentStore';
import type { ExpansionModule, Severity } from '@/types/assessment';

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

const SEVERITY_ORDER: Record<Severity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Info: 4,
};

export function SalesforceBriefing() {
  const payload = useAssessmentStore((s) => s.payload);
  if (!payload) return null;

  const verdict = payload.verdict;
  const loe = payload.loeEstimate;
  const topConcerns = [...payload.topConcerns]
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .slice(0, 3);
  const signals = payload.expansionSignals.slice(0, 5);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 print:max-w-none print:px-8 print:py-0">
      {/* Action bar — hidden in print */}
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden" data-no-print="true">
        <Link
          to="/assessment/salesforce"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground focus-ring"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to readiness
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90 focus-ring"
        >
          <Printer className="h-4 w-4" />
          Print to PDF
        </button>
      </div>

      {/* Printable page */}
      <article className="print-page space-y-6 rounded-lg border border-border bg-card p-8 text-sm leading-relaxed print:rounded-none print:border-0 print:bg-white print:p-0 print:text-black">
        <header className="border-b border-border pb-4 print:border-black/20">
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              Salesforce briefing
            </h1>
            <span className="text-xs uppercase tracking-wide text-muted-foreground print:text-black/60">
              Vento · CPQ → RCA Assessment
            </span>
          </div>
          <p className="mt-1 text-base text-muted-foreground print:text-black/70">
            {payload.meta.orgName} · Generated {new Date(payload.meta.generatedAt).toLocaleDateString()}
          </p>
        </header>

        {/* Verdict */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground print:text-black/60">
            Verdict
          </h2>
          <p className="mt-1 text-base font-medium">
            {verdict.recommendation === 'Proceed'
              ? 'Ready'
              : verdict.recommendation === 'Proceed_With_Caution'
              ? 'Needs preparation'
              : 'Not ready'}
            {' · '}
            <span className="font-normal text-muted-foreground print:text-black/70">
              SI-ready in {loe.weeksLow}–{loe.weeksHigh} weeks ({loe.confidence.toLowerCase()} confidence)
            </span>
          </p>
          <p className="mt-2 text-sm text-foreground/90 print:text-black/85">{verdict.rationale}</p>
        </section>

        {/* Top concerns */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground print:text-black/60">
            Top concerns ({topConcerns.length} of {payload.topConcerns.length})
          </h2>
          <ol className="mt-2 list-decimal space-y-2 pl-5">
            {topConcerns.map((c) => (
              <li key={c.id}>
                <span className="font-medium">{c.title}</span>{' '}
                <span className="text-xs uppercase tracking-wide text-muted-foreground print:text-black/60">
                  · {c.severity}
                </span>
                <p className="mt-0.5 text-sm text-foreground/85 print:text-black/80">
                  {c.audienceFraming.salesforce.headline}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Expansion signals */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground print:text-black/60">
            Expansion signals ({signals.length})
          </h2>
          <ul className="mt-2 space-y-1.5">
            {signals.map((s) => (
              <li key={s.module} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent print:bg-black" />
                <div>
                  <span className="font-medium">{MODULE_LABEL[s.module]}</span>{' '}
                  <span className="text-xs uppercase tracking-wide text-muted-foreground print:text-black/60">
                    · {s.confidence} confidence
                  </span>
                  <p className="text-sm italic text-muted-foreground print:text-black/75">
                    {s.consultativeFraming}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Co-sell line */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground print:text-black/60">
            Co-sell narrative
          </h2>
          <p className="mt-1 text-sm text-foreground/90 print:text-black/85">
            {payload.aiNarratives.salesforce}
          </p>
        </section>

        {/* Footer disclaimer */}
        <footer className="border-t border-border pt-3 text-xs italic text-muted-foreground print:border-black/20 print:text-black/60">
          {loe.disclaimer} · meta.truthLabel: {payload.meta.truthLabel}
        </footer>
      </article>
    </div>
  );
}
