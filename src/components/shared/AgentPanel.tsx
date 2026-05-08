import { ChevronRight, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentStore } from '@/store/useAgentStore';

const PREBUILT_BY_LAYER: Record<string, string[]> = {
  executive: [
    'Should we migrate now?',
    "What's the biggest business risk?",
    'What will slow this project down?',
    'What RCA capabilities could we unlock?',
  ],
  sales: [
    'What should I say on the discovery call?',
    'What should go into the SOW?',
    'Where could scope creep happen?',
    'What caveats should I include?',
  ],
  salesforce: [
    'Is this account ready for Revenue Cloud / Agentforce Revenue Management?',
    'What expansion signals exist?',
    'What should Salesforce position?',
    'What implementation risk should we warn the partner about?',
  ],
  migration: [
    'Why this target pattern?',
    'What edge cases should I test?',
    'What is unsafe to automate?',
    'What requires manual review?',
  ],
  implementation: [
    'Why is this complexity rated high?',
    'What technical risks should I plan for?',
    "What's the dependency footprint?",
  ],
  default: ['Walk me through this assessment.'],
};

export function AgentPanel({ layer }: { layer: string }) {
  const { open, toggle } = useAgentStore();
  const prebuilts = PREBUILT_BY_LAYER[layer] ?? PREBUILT_BY_LAYER.default;

  return (
    <aside
      data-no-print="true"
      className={cn(
        'flex h-full flex-col border-l border-border bg-card transition-all duration-200',
        open ? 'w-80' : 'w-12',
      )}
    >
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-2 border-b border-border px-3 py-3 text-sm font-medium text-foreground hover:bg-muted focus-ring"
        aria-label={open ? 'Collapse agent panel' : 'Expand agent panel'}
      >
        {open ? <ChevronRight className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
        {open && <span>Ask the assessment</span>}
      </button>
      {open && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 text-sm text-muted-foreground">
            <p>The agent connects in M3. Layer-specific prebuilt questions:</p>
            <ul className="mt-3 space-y-2">
              {prebuilts.map((q) => (
                <li
                  key={q}
                  className="rounded-md border border-border bg-muted/40 px-3 py-2 text-foreground/80"
                >
                  {q}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-border p-3">
            <input
              type="text"
              placeholder="Ask a question…"
              disabled
              className="w-full rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground placeholder:text-muted-foreground focus-ring"
            />
          </div>
        </div>
      )}
    </aside>
  );
}
