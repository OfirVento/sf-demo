import Anthropic from '@anthropic-ai/sdk';

let cached: Anthropic | null = null;

/**
 * Lazy-initialised Anthropic SDK client. `dangerouslyAllowBrowser` is required
 * for direct browser use; this is acceptable for the AllCloud demo on a
 * controlled URL but should never ship to a public production environment.
 */
export function getClient(): Anthropic {
  if (cached) return cached;
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'VITE_ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add a key.',
    );
  }
  cached = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  return cached;
}

export const AGENT_MODEL = import.meta.env.VITE_AGENT_MODEL ?? 'claude-sonnet-4';
