import fs from 'node:fs';
import path from 'node:path';

import { readFile, rel } from '../fs';

import type { ScanContext, Violation } from '../types';

/**
 * If a module ships a `locales/` directory, it must contain at minimum
 * `en.ts`, `fr.ts`, and an `index.ts` barrel — keeps every locale-aware
 * module shippable in both languages.
 */
export function scanLocaleParity(ctx: ScanContext): Violation[] {
  const out: Violation[] = [];
  for (const m of ctx.modules) {
    const dir = path.join(m.srcDir, 'locales');
    if (!fs.existsSync(dir)) continue;
    for (const required of ['en.ts', 'fr.ts', 'index.ts']) {
      const f = path.join(dir, required);
      if (!fs.existsSync(f)) {
        out.push({
          rule: 'locale-parity',
          module: m.name,
          file: rel(dir, ctx.repoRoot),
          message: `missing locales/${required}`,
        });
      }
    }
    const en = path.join(dir, 'en.ts');
    const fr = path.join(dir, 'fr.ts');
    if (fs.existsSync(en) && !/export\s+const\s+\w+TranslationsEn\b/.test(readFile(en))) {
      out.push({
        rule: 'locale-export',
        module: m.name,
        file: rel(en, ctx.repoRoot),
        message: 'en.ts must export <slug>TranslationsEn',
      });
    }
    if (fs.existsSync(fr) && !/export\s+const\s+\w+TranslationsFr\b/.test(readFile(fr))) {
      out.push({
        rule: 'locale-export',
        module: m.name,
        file: rel(fr, ctx.repoRoot),
        message: 'fr.ts must export <slug>TranslationsFr',
      });
    }
  }
  return out;
}
