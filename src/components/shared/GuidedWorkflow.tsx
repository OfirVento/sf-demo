import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ClipboardList,
  Compass,
  FileDown,
  MessageSquare,
  Plug,
  ScanSearch,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentStore } from '@/store/useAgentStore';
import { GUIDED_STEPS, useGuidedStore, type GuidedStep } from '@/store/useGuidedStore';
import { useAssessmentStore } from '@/store/useAssessmentStore';

const STEP_META: Record<
  GuidedStep,
  { title: string; copy: string; icon: typeof Compass; cta: string }
> = {
  connect: {
    title: 'Connect a Salesforce CPQ org',
    copy: 'Vento authenticates against the Salesforce org with read-only credentials and pulls the assessment scope. For the demo, the connection is stubbed.',
    icon: Plug,
    cta: 'Connect (stubbed)',
  },
  assess: {
    title: 'Run the assessment',
    copy: 'Metadata extraction, code dependency scan, complexity scoring, RCA opportunity matching, and AI narrative generation. Typically takes a few minutes; this demo runs the cached assessment for Vector Systems.',
    icon: ScanSearch,
    cta: 'Run assessment',
  },
  pick: {
    title: 'Pick your view',
    copy: 'Five audience layers reframe the same evidence for different readers. Most users start at Executive, then drill into Migration Drafts.',
    icon: ClipboardList,
    cta: 'Open Executive view',
  },
  concerns: {
    title: 'Review the top concerns',
    copy: 'Each concern has executive framing, evidence, and a recommended next action. Click any "View supporting evidence" link for the three-level drawer.',
    icon: ClipboardList,
    cta: 'Continue',
  },
  agent: {
    title: 'Ask the assessment',
    copy: 'Layer-aware agent grounded in the payload + RCA knowledge base. Layer-specific prebuilt questions are at the top; free-form input below. Streaming responses with stop + re-roll.',
    icon: MessageSquare,
    cta: 'Open the agent panel',
  },
  export: {
    title: 'Export or draft',
    copy: 'Export a one-page Salesforce briefing for the account team, or jump to AI Migration Drafts to generate per-artifact RCA candidates with reasoning and tests.',
    icon: FileDown,
    cta: 'Finish',
  },
};

const RUN_DURATION_MS = 3500;

export function GuidedWorkflow() {
  const { open, step, next, prev, dismiss } = useGuidedStore();
  const payload = useAssessmentStore((s) => s.payload);
  const setAgentOpen = useAgentStore((s) => s.setOpen);
  const navigate = useNavigate();
  const [runProgress, setRunProgress] = useState(0);

  // First-time auto-launch: if the user has never seen the workflow, show it.
  // Wait for the persist middleware to hydrate before reading `seen`, otherwise
  // we race the localStorage read and incorrectly treat returning users as
  // first-time visitors.
  useEffect(() => {
    let cancelled = false;
    const launch = () => {
      if (cancelled) return;
      const { seen, open, start } = useGuidedStore.getState();
      if (!seen && !open) start();
    };
    const persist = useGuidedStore.persist;
    if (persist.hasHydrated()) {
      const t = setTimeout(launch, 350);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }
    const unsub = persist.onFinishHydration(() => {
      const t = setTimeout(launch, 350);
      // Best-effort cleanup — the unsubscribe ref handles the rest.
      void t;
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  // Step 2 ("assess") simulates a 3.5s scan with a progress bar that fills,
  // then auto-advances. We restart the bar each time the step opens.
  useEffect(() => {
    if (step !== 'assess' || !open) return;
    setRunProgress(0);
    const start = Date.now();
    const id = setInterval(() => {
      const t = (Date.now() - start) / RUN_DURATION_MS;
      setRunProgress(Math.min(1, t));
      if (t >= 1) {
        clearInterval(id);
        next();
      }
    }, 80);
    return () => clearInterval(id);
  }, [step, open, next]);

  if (!open) return null;

  const meta = STEP_META[step];
  const StepIcon = meta.icon;
  const stepIndex = GUIDED_STEPS.indexOf(step);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === GUIDED_STEPS.length - 1;

  function handleAction() {
    if (step === 'pick') {
      navigate('/assessment/executive');
      next();
      return;
    }
    if (step === 'agent') {
      setAgentOpen(true);
      next();
      return;
    }
    if (step === 'export') {
      navigate('/assessment/salesforce/briefing');
      dismiss();
      return;
    }
    next();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      role="dialog"
      aria-label="Guided workflow"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss guided workflow"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl">
        {/* Step indicator */}
        <div className="flex items-center justify-between border-b border-border px-6 py-3 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Compass className="h-3.5 w-3.5" />
            Guided walkthrough
          </div>
          <div className="flex items-center gap-1">
            {GUIDED_STEPS.map((s, i) => (
              <span
                key={s}
                className={cn(
                  'h-1.5 w-6 rounded-full transition-colors',
                  i < stepIndex
                    ? 'bg-accent'
                    : i === stepIndex
                    ? 'bg-accent'
                    : 'bg-muted',
                )}
                aria-hidden
              />
            ))}
            <span className="ml-2 font-mono text-muted-foreground">
              {stepIndex + 1}/{GUIDED_STEPS.length}
            </span>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-ring"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="rounded-md bg-accent/10 p-3 text-accent">
              <StepIcon className="h-6 w-6" aria-hidden />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {meta.title}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{meta.copy}</p>
            </div>
          </div>

          {/* Step-specific body */}
          {step === 'connect' && (
            <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Org</span>
                <span className="font-medium text-foreground">
                  {payload?.meta.orgName ?? 'Vector Systems'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Org ID</span>
                <span className="font-mono text-xs text-foreground">
                  {payload?.meta.orgIdentifier ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Edition</span>
                <span className="font-medium text-foreground">
                  {payload?.orgProfile.edition ?? 'Enterprise'}
                </span>
              </div>
            </div>
          )}

          {step === 'assess' && (
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-accent transition-[width] duration-200 ease-out"
                  style={{ width: `${Math.round(runProgress * 100)}%` }}
                />
              </div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li className={cn('flex items-center gap-2', runProgress > 0.15 && 'text-foreground')}>
                  {runProgress > 0.15 ? <Check className="h-3 w-3 text-emerald-500" /> : <span className="h-3 w-3" />}
                  Metadata extraction
                </li>
                <li className={cn('flex items-center gap-2', runProgress > 0.4 && 'text-foreground')}>
                  {runProgress > 0.4 ? <Check className="h-3 w-3 text-emerald-500" /> : <span className="h-3 w-3" />}
                  Code dependency scan
                </li>
                <li className={cn('flex items-center gap-2', runProgress > 0.65 && 'text-foreground')}>
                  {runProgress > 0.65 ? <Check className="h-3 w-3 text-emerald-500" /> : <span className="h-3 w-3" />}
                  Complexity scoring
                </li>
                <li className={cn('flex items-center gap-2', runProgress > 0.9 && 'text-foreground')}>
                  {runProgress > 0.9 ? <Check className="h-3 w-3 text-emerald-500" /> : <span className="h-3 w-3" />}
                  RCA opportunity matching + AI narratives
                </li>
              </ul>
            </div>
          )}

          {step === 'pick' && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Executive', recommended: true },
                { label: 'Sales' },
                { label: 'Salesforce' },
                { label: 'Migration drafts' },
                { label: 'Implementation' },
              ].map((o) => (
                <div
                  key={o.label}
                  className={cn(
                    'rounded-md border px-3 py-2 font-medium',
                    o.recommended
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : 'border-border bg-muted/20 text-foreground/80',
                  )}
                >
                  {o.label} {o.recommended && <span className="ml-1 text-[10px]">recommended</span>}
                </div>
              ))}
            </div>
          )}

          {step === 'agent' && (
            <div className="rounded-md border border-border bg-muted/20 p-3 text-xs text-foreground/80">
              <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                Try a prebuilt question
              </div>
              <ul className="space-y-1">
                <li>• Should we migrate now?</li>
                <li>• What's the biggest business risk?</li>
                <li>• What RCA capabilities could we unlock?</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-3 border-t border-border px-6 py-3">
          <button
            type="button"
            onClick={dismiss}
            className="rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground focus-ring"
          >
            Skip walkthrough
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && step !== 'assess' && (
              <button
                type="button"
                onClick={prev}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-ring"
              >
                Back
              </button>
            )}
            {step !== 'assess' && (
              <button
                type="button"
                onClick={handleAction}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90 focus-ring"
              >
                {isLast ? meta.cta : meta.cta}
                {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

/** Compass button for the TopBar — re-launches the guided walkthrough. */
export function GuidedWorkflowTrigger() {
  const start = useGuidedStore((s) => s.start);
  return (
    <button
      type="button"
      onClick={start}
      title="Re-run the guided walkthrough"
      aria-label="Re-run guided walkthrough"
      className="rounded-md border border-border bg-card p-1.5 text-muted-foreground hover:text-foreground focus-ring"
    >
      <Compass className="h-4 w-4" />
    </button>
  );
}
