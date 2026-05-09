import type Anthropic from '@anthropic-ai/sdk';
import type { AssessmentPayload } from '@/types/assessment';
// Vite ?raw imports the markdown file as a string at build time.
import KB_TEXT from '../../../inputs/rca-knowledge-base.md?raw';

const STATIC_PREFIX = `You are an expert Salesforce Revenue Cloud Advanced (RCA) consultant helping with a CPQ → RCA migration assessment.

You have access to:
1. The full assessment payload for this customer's org (provided in a separate block).
2. The RCA knowledge base reference (provided in a separate block).

Rules:
- Ground every claim in evidence from the assessment payload. Cite specific fields (e.g. "complexityScores.dimensions.pricingLogic.signal") or artifact IDs (e.g. "q-003") when you make a numerical or factual claim.
- Express clear uncertainty when evidence is incomplete. Prefer "based on the assessment, X looks Y" over "X is Y" when evidence is heuristic or partial.
- Use Revenue Cloud / Agentforce Revenue Management terminology when speaking to Salesforce-facing audiences.
- Frame expansion opportunities consultatively ("may be relevant if...") not as pitches.
- For migration draft questions, never claim production-readiness — drafts require human review by definition.
- Respond in plain language calibrated to the current audience (specified in the audience block below).
- When referencing knowledge-base content, paraphrase rather than quote at length. Cite the KB section if relevant (e.g. "KB §3.2").
- Keep responses concise: aim for 3–6 short paragraphs unless the question warrants depth.`;

export type AudienceLayer =
  | 'executive'
  | 'sales'
  | 'salesforce'
  | 'migration'
  | 'implementation'
  | 'default';

const LAYER_FRAMING: Record<AudienceLayer, string> = {
  executive:
    'Concise, decisive, business-impact framed. Avoid deep technical jargon. Lead with verdict and recommended next action; numbers should be rounded for executive consumption.',
  sales:
    'Discovery-call ready. Talking-point format. Surface SOW caveats and change-order risks explicitly. Frame language for the AllCloud seller speaking to a prospect.',
  salesforce:
    'Use canonical Revenue Cloud / Agentforce Revenue Management terminology (KB §6). Frame expansion signals consultatively. Address the Salesforce account team and their partner motion.',
  migration:
    'Technical depth on CPQ→RCA conversion patterns. Cite KB §3.x conversion patterns by section number where applicable. Never claim production-readiness on AI-generated drafts. Address a delivery engineer or tech lead.',
  implementation:
    'Specific, technical, severity-aware. Tie findings to KB §5 pitfall references where relevant (e.g. "KB §5.2 / P5"). Address the delivery team responsible for the work.',
  default:
    'Adapt tone to the question. Default to executive framing if the audience is unclear.',
};

/**
 * Build the system blocks for an agent request. Caching strategy:
 *
 *   [0] static prefix     — frozen across requests (prefix-cached)
 *   [1] assessment payload — frozen for the session
 *   [2] knowledge base    — frozen for the session, holds the cache breakpoint
 *   [3] per-layer audience — variable; placed AFTER the breakpoint so layer
 *                            switches do not invalidate the cached prefix
 *
 * On every (re)request the [0]+[1]+[2] prefix is served from cache at ~10%
 * cost. See shared/prompt-caching.md.
 */
export function buildSystemBlocks(
  payload: AssessmentPayload,
  layer: AudienceLayer,
): Anthropic.TextBlockParam[] {
  return [
    { type: 'text', text: STATIC_PREFIX },
    {
      type: 'text',
      text: `ASSESSMENT PAYLOAD:\n${JSON.stringify(payload, null, 2)}`,
    },
    {
      type: 'text',
      text: `RCA KNOWLEDGE BASE:\n${KB_TEXT}`,
      cache_control: { type: 'ephemeral' },
    },
    {
      type: 'text',
      text: `Current audience: ${layer}\nLayer-specific framing: ${LAYER_FRAMING[layer]}`,
    },
  ];
}
