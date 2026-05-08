import Ajv, { type ErrorObject } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import schema from '../../../inputs/assessment-schema.json';
import payload from '../../../inputs/assessment-payload.json';
import type { AssessmentPayload } from '@/types/assessment';

export type ValidationFailure = {
  ok: false;
  errors: ErrorObject[];
};

export type ValidationSuccess = {
  ok: true;
  payload: AssessmentPayload;
};

export type ValidationResult = ValidationSuccess | ValidationFailure;

let cached: ValidationResult | null = null;

export function loadAssessmentPayload(): ValidationResult {
  if (cached) return cached;

  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema as object);

  if (!validate(payload)) {
    cached = { ok: false, errors: validate.errors ?? [] };
    return cached;
  }
  cached = { ok: true, payload: payload as unknown as AssessmentPayload };
  return cached;
}
