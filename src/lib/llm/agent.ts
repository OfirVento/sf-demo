import type Anthropic from '@anthropic-ai/sdk';
import { AGENT_MODEL, getClient } from './anthropic';
import { buildSystemBlocks, type AudienceLayer } from './systemPrompt';
import type { AssessmentPayload } from '@/types/assessment';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export type StreamCallbacks = {
  onText: (delta: string) => void;
  onDone: (finalText: string, usage?: Anthropic.Messages.Usage) => void;
  onError: (error: Error) => void;
};

export type AskAgentArgs = {
  question: string;
  history: ChatMessage[];
  payload: AssessmentPayload;
  layer: AudienceLayer;
  signal?: AbortSignal;
} & StreamCallbacks;

/**
 * Stream an agent response. Returns when the stream resolves; tokens are
 * emitted via onText, the final text + token usage via onDone, and any
 * error via onError. Cancel by aborting the AbortSignal passed in.
 */
export async function askAgent({
  question,
  history,
  payload,
  layer,
  signal,
  onText,
  onDone,
  onError,
}: AskAgentArgs): Promise<void> {
  try {
    const client = getClient();
    const messages: Anthropic.MessageParam[] = [
      ...history.map<Anthropic.MessageParam>((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: question },
    ];

    const stream = client.messages.stream(
      {
        model: AGENT_MODEL,
        max_tokens: 16000,
        system: buildSystemBlocks(payload, layer),
        messages,
      },
      signal ? { signal } : undefined,
    );

    stream.on('text', (delta) => onText(delta));

    const final = await stream.finalMessage();
    const finalText = final.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    onDone(finalText, final.usage);
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') {
      onDone('', undefined);
      return;
    }
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}

/**
 * One-shot non-conversational generation used by the narrative re-roll.
 * Same caching prefix as askAgent — cheap on repeat calls.
 */
export async function regenerateNarrative({
  payload,
  layer,
  signal,
}: {
  payload: AssessmentPayload;
  layer: AudienceLayer;
  signal?: AbortSignal;
}): Promise<string> {
  const prompt =
    layer === 'executive'
      ? 'Re-generate the executive narrative paragraph for this assessment in 4–6 sentences. Cite the org-wide totals from complexityScores.dimensions[*].signal (price rules, QCP scripts, quote-calc Apex). End with a decisive recommended next action. Vary phrasing from the existing narrative; do not repeat it verbatim.'
      : `Re-generate the ${layer} narrative paragraph for this assessment in 3–5 sentences. Vary phrasing from the existing narrative; do not repeat it verbatim. End with a clear next action calibrated to the audience.`;

  const client = getClient();
  const message = await client.messages.create(
    {
      model: AGENT_MODEL,
      max_tokens: 1024,
      system: buildSystemBlocks(payload, layer),
      messages: [{ role: 'user', content: prompt }],
    },
    signal ? { signal } : undefined,
  );

  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
}
