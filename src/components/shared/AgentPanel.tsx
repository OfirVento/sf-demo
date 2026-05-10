import { useEffect, useRef, useState } from 'react';
import { ChevronRight, MessageSquare, Send, Square, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentStore } from '@/store/useAgentStore';
import { useAssessmentStore } from '@/store/useAssessmentStore';
import { askAgent, type ChatMessage } from '@/lib/llm/agent';
import type { AudienceLayer } from '@/lib/llm/systemPrompt';
import { TruthLabel } from './TruthLabel';

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
  const {
    open,
    toggle,
    messages,
    append,
    patch,
    controller,
    setController,
    abort,
    dropTrailingEmptyAssistant,
  } = useAgentStore();
  const payload = useAssessmentStore((s) => s.payload);
  const prebuilts = PREBUILT_BY_LAYER[layer] ?? PREBUILT_BY_LAYER.default;
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isStreaming = controller !== null;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function send(question: string) {
    if (!payload || !question.trim() || isStreaming) return;

    // Defensive: if the previous turn left an errored or empty trailing
    // assistant message in history, drop it before posting — the API
    // rejects empty assistant turns.
    dropTrailingEmptyAssistant();

    append({ role: 'user', content: question.trim() });
    const assistantId = append({ role: 'assistant', content: '', streaming: true });
    const c = new AbortController();
    setController(c);

    const history: ChatMessage[] = messages
      .filter((m) => !m.error)
      .map((m) => ({ id: m.id, role: m.role, content: m.content }));

    let buf = '';
    await askAgent({
      question: question.trim(),
      history,
      payload,
      layer: layer as AudienceLayer,
      signal: c.signal,
      onText: (delta) => {
        buf += delta;
        patch(assistantId, { content: buf });
      },
      onDone: (finalText) => {
        const text = finalText || buf;
        patch(assistantId, { content: text, streaming: false });
        setController(null);
        // If user aborted before any tokens streamed, drop the empty
        // assistant message so the next send doesn't 400 with
        // {role: 'assistant', content: ''}.
        if (!text || !text.trim()) dropTrailingEmptyAssistant();
      },
      onError: (err) => {
        patch(assistantId, {
          content: '',
          streaming: false,
          error: err.message,
        });
        setController(null);
        // Errored assistant message is also problematic on next send —
        // drop it after the error has been surfaced briefly. We keep it
        // visible by marking it errored; the drop only fires next time
        // the user types something. (Handled in send() guard below.)
      },
    });
  }

  async function reroll(messageId: string) {
    if (!payload || isStreaming) return;
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx <= 0) return;
    const user = messages[idx - 1];
    if (!user || user.role !== 'user') return;
    useAgentStore.getState().truncateAfter(messageId);
    await send(user.content);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const q = input;
    setInput('');
    void send(q);
  }

  return (
    <aside
      data-no-print="true"
      className={cn(
        'flex h-full flex-col border-l border-border bg-card transition-all duration-200',
        open ? 'w-96' : 'w-12',
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
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Ask anything about this assessment. The agent grounds its answers in the payload
                  and the RCA knowledge base.
                </p>
                <div className="space-y-2">
                  {prebuilts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void send(q)}
                      className="block w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-left text-foreground/90 hover:bg-muted hover:text-foreground focus-ring"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <div className="pt-1">
                  <TruthLabel variant="ai_generated" />
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                {messages.map((m) => (
                  <div key={m.id} className="space-y-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {m.role === 'user' ? 'You' : 'Assistant'}
                    </div>
                    {m.error ? (
                      <p className="rounded-md bg-severity-high/10 px-3 py-2 text-severity-high">
                        Error: {m.error}
                      </p>
                    ) : (
                      <p
                        className={cn(
                          'whitespace-pre-wrap rounded-md px-3 py-2',
                          m.role === 'user'
                            ? 'bg-accent/10 text-foreground'
                            : 'bg-muted/40 text-foreground/95',
                        )}
                      >
                        {m.content}
                        {m.streaming && (
                          <span
                            className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-accent align-middle"
                            aria-label="Streaming"
                          />
                        )}
                      </p>
                    )}
                    {m.role === 'assistant' && !m.streaming && !m.error && (
                      <button
                        type="button"
                        onClick={() => void reroll(m.id)}
                        disabled={isStreaming}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground focus-ring disabled:opacity-50"
                      >
                        <RotateCw className="h-3 w-3" /> Re-roll
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-border px-3 py-3"
          >
            <input
              type="text"
              placeholder={isStreaming ? 'Streaming…' : 'Ask a question…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming}
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-ring disabled:opacity-60"
            />
            {isStreaming ? (
              <button
                type="button"
                onClick={abort}
                className="rounded-md bg-severity-high px-3 py-2 text-sm text-white hover:opacity-90 focus-ring"
                aria-label="Stop generating"
              >
                <Square className="h-4 w-4" fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground hover:opacity-90 focus-ring disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </form>
        </>
      )}
    </aside>
  );
}
