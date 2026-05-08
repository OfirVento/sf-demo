import { compileFromFile } from 'json-schema-to-typescript';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const SCHEMA = path.resolve('inputs/assessment-schema.json');
const OUT = path.resolve('src/types/assessment.ts');

async function main() {
  const ts = await compileFromFile(SCHEMA, {
    bannerComment:
      '/* eslint-disable */\n/**\n * Auto-generated from inputs/assessment-schema.json.\n * Do not edit by hand. Run `npm run generate:types`.\n */\n',
    style: { singleQuote: true, semi: true },
    additionalProperties: false,
  });
  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, ts, 'utf8');
  console.log(`Wrote ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
