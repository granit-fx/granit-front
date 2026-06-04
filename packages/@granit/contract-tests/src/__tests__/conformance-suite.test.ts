import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { checkSchemaConformance } from '../conformance';
import { CONTRACTS } from '../manifest';

import type { OpenApiDocument } from '../conformance';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(here, '../../../../..');

function loadSpec(slug: string): OpenApiDocument {
  return JSON.parse(
    readFileSync(path.join(REPO_ROOT, 'contracts/openapi', `${slug}.json`), 'utf8')
  ) as OpenApiDocument;
}

/** Find the source file that declares `interface <typeName>` under a package's src. */
function findInterfaceFile(srcDir: string, typeName: string): string | undefined {
  const needle = new RegExp(`\\binterface\\s+${typeName}\\b`);
  const stack = [srcDir];
  while (stack.length) {
    const dir = stack.pop();
    if (dir === undefined) break;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', 'dist', '__tests__'].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.endsWith('.ts') && needle.test(readFileSync(full, 'utf8'))) return full;
    }
  }
  return undefined;
}

describe.each(CONTRACTS.map((m) => [m.slug, m] as const))(
  'contract conformance — %s',
  (_slug, mod) => {
    const spec = loadSpec(mod.slug);
    const srcDir = path.join(REPO_ROOT, 'packages/@granit', mod.package, 'src');

    it.each(mod.types.map((t) => [t]))(
      `@granit/${mod.package} %s mirrors the backend schema`,
      (type) => {
        const file = findInterfaceFile(srcDir, type);
        expect(file, `interface ${type} not found in @granit/${mod.package}`).toBeTruthy();
        const violations = checkSchemaConformance({
          spec,
          schemaName: type,
          sourceText: readFileSync(file!, 'utf8'),
          fileName: file!,
        });
        expect(violations).toEqual([]);
      }
    );
  }
);
