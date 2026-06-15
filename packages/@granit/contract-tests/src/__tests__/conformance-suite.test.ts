import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { checkSchemaConformance } from '../conformance';
import { checkEndpointConformance } from '../endpoints';
import { CONTRACTS } from '../manifest';

import type { OpenApiDocument } from '../conformance';
import type { OpenApiPaths } from '../endpoints';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(here, '../../../../..');

function loadSpec(slug: string): OpenApiDocument {
  return JSON.parse(
    readFileSync(path.join(REPO_ROOT, 'contracts/openapi', `${slug}.json`), 'utf8')
  ) as OpenApiDocument;
}

/** Find the source file declaring `interface X` or `type X = …` under a package's src. */
function findInterfaceFile(srcDir: string, typeName: string): string | undefined {
  // Match a declaration (`interface X` / `type X =` / `type X<`), not a
  // re-export specifier (`export { type X }` barrels list `type X,` which would
  // otherwise resolve to the barrel file instead of the declaration).
  const needle = new RegExp(`\\binterface\\s+${typeName}\\b|\\btype\\s+${typeName}\\s*[=<]`);
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

/** Read every `api/**\/*.ts` (non-test) file under a package's src. */
function readApiSources(srcDir: string): { file: string; text: string }[] {
  const out: { file: string; text: string }[] = [];
  const walk = (dir: string, underApi: boolean): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', 'dist', '__tests__'].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, underApi || entry.name === 'api');
      else if (underApi && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
        out.push({ file: full, text: readFileSync(full, 'utf8') });
      }
    }
  };
  walk(srcDir, false);
  return out;
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

    if (mod.checkEndpoints) {
      it(`@granit/${mod.package} api/ routes mirror the backend endpoints`, () => {
        const violations = checkEndpointConformance(
          mod.slug,
          spec as OpenApiPaths,
          readApiSources(srcDir),
          { ignore: mod.endpointIgnore }
        );
        expect(violations).toEqual([]);
      });
    }
  }
);
