import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const SCHEMA = path.resolve('inputs/assessment-schema.json');
const PAYLOAD = path.resolve('inputs/assessment-payload.json');

async function main() {
  const [schemaText, payloadText] = await Promise.all([
    readFile(SCHEMA, 'utf8'),
    readFile(PAYLOAD, 'utf8'),
  ]);
  const schema = JSON.parse(schemaText);
  const payload = JSON.parse(payloadText);

  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  if (!validate(payload)) {
    console.error('Payload failed schema validation:');
    for (const err of validate.errors ?? []) {
      console.error(`  ${err.instancePath || '/'} ${err.message}`);
    }
    process.exit(1);
  }
  console.log('Payload OK against schema.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
