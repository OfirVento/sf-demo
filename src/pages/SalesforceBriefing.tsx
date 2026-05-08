import { useAssessmentStore } from '@/store/useAssessmentStore';

export function SalesforceBriefing() {
  const payload = useAssessmentStore((s) => s.payload);
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 print:px-0 print:py-0">
      <div className="print-page rounded-lg border border-border bg-card p-8 print:rounded-none print:border-0 print:p-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Salesforce briefing — {payload?.meta.orgName ?? 'org'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          One-page briefing for Salesforce account team. Print-ready (Cmd/Ctrl+P).
        </p>
        <p className="mt-6 text-sm italic text-muted-foreground">
          M5 populates this briefing.
        </p>
      </div>
      <div className="mt-4 flex gap-3 print:hidden" data-no-print="true">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90 focus-ring"
        >
          Print to PDF
        </button>
      </div>
    </div>
  );
}
