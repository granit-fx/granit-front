import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { checkSchemaConformance } from '../conformance';

import type { OpenApiDocument } from '../conformance';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(here, '../../../../..');

const spec = JSON.parse(
  readFileSync(path.join(REPO_ROOT, 'contracts/openapi/background-jobs.json'), 'utf8')
) as OpenApiDocument;

const typesFile = path.join(REPO_ROOT, 'packages/@granit/background-jobs/src/types/index.ts');
const sourceText = readFileSync(typesFile, 'utf8');

describe('contract conformance — @granit/background-jobs', () => {
  it('BackgroundJobStatus mirrors the backend OpenAPI schema', () => {
    expect(
      checkSchemaConformance({
        spec,
        schemaName: 'BackgroundJobStatus',
        sourceText,
        fileName: typesFile,
      })
    ).toEqual([]);
  });
});
