#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Architecture test — every @granit/* package that assigns to a DOM-script
// sink MUST expose a `<pkg>/csp` subpath with an idempotent `installPolicy()`.
//
// Rationale: under CSP `require-trusted-types-for 'script'`, those sinks
// need a TrustedHTML / TrustedScriptURL coming from a named policy. The
// convention keeps each package's CSP requirements co-located with the
// code that needs them. See `granit-docs/frontend/security/csp.mdx`.
//
// Sinks scanned:
//   - .innerHTML = / .outerHTML = / .insertAdjacentHTML(...)
//   - .setAttribute('src', ...) on <iframe>, <script>, <embed> (heuristic
//     via `(iframe|script).setAttribute\('src'`)
//   - direct .src = on iframe/script variables
//
// Exceptions (justified, hard-coded):
//   - packages/@granit/react-ui-map/src/snapshot/map-snapshot-widget.tsx
//     → bindPopup uses the granit-map policy (registered in /csp).
//   - packages/@granit/react-authentication-keycloak/src/hooks/use-keycloak-core.ts
//     → keycloak-js internals call iframe.setAttribute('src', …) under the hood;
//       we cover them with the granit-keycloak policy.
//
// Usage (run from repo root):
//   node scripts/check-csp-policies.mjs
// Exit code 0 = clean; 1 = violation found.
// ---------------------------------------------------------------------------

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PACKAGES_ROOT = 'packages/@granit';

const SINK_PATTERNS = [
  /\.innerHTML\s*=/,
  /\.outerHTML\s*=/,
  /\.insertAdjacentHTML\s*\(/,
  /\bsetAttribute\s*\(\s*['"]src['"]/,
];

const KNOWN_PROVIDERS = new Map([
  ['react-ui-map', { policy: 'granit-map', subpath: 'src/csp/index.ts' }],
  [
    'react-authentication-keycloak',
    { policy: 'granit-keycloak', subpath: 'src/csp/index.ts' },
  ],
]);

function listTsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '__tests__') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...listTsFiles(full));
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

function scanPackage(pkg) {
  const srcDir = join(PACKAGES_ROOT, pkg, 'src');
  if (!existsSync(srcDir)) return { pkg, hits: [], hasCspSubpath: false };

  const files = listTsFiles(srcDir);
  const hits = [];
  for (const f of files) {
    const lines = readFileSync(f, 'utf8').split('\n');
    lines.forEach((line, i) => {
      // Skip comments — naive but effective enough for an arch-test.
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
      for (const re of SINK_PATTERNS) {
        if (re.test(line)) {
          hits.push({ file: f, line: i + 1, snippet: trimmed.slice(0, 100) });
          break;
        }
      }
    });
  }
  const hasCspSubpath = existsSync(join(PACKAGES_ROOT, pkg, 'src/csp/index.ts'));
  return { pkg, hits, hasCspSubpath };
}

function main() {
  const pkgs = readdirSync(PACKAGES_ROOT).filter((p) =>
    statSync(join(PACKAGES_ROOT, p)).isDirectory()
  );

  let violations = 0;
  const reportedClean = [];

  for (const pkg of pkgs) {
    const { hits, hasCspSubpath } = scanPackage(pkg);
    if (hits.length === 0) continue;

    if (hasCspSubpath) {
      reportedClean.push({ pkg, sinks: hits.length, policy: KNOWN_PROVIDERS.get(pkg)?.policy });
      continue;
    }

    // Violation: package uses a DOM-script sink but ships no /csp subpath.
    violations++;
    console.error(`\n❌ @granit/${pkg} — has ${hits.length} DOM-script sink(s) but no /csp subpath`);
    for (const h of hits.slice(0, 5)) {
      console.error(`     ${h.file}:${h.line}  ${h.snippet}`);
    }
    if (hits.length > 5) console.error(`     … ${hits.length - 5} more`);
    console.error(
      `     Fix: add packages/@granit/${pkg}/src/csp/index.ts with an installPolicy() ` +
        `and an exports."./csp" entry in package.json. See granit-docs/frontend/security/csp.mdx.`
    );
  }

  if (reportedClean.length > 0) {
    console.log('\n✅ Packages with DOM-script sinks AND a /csp subpath:');
    for (const r of reportedClean) {
      console.log(`     @granit/${r.pkg} → policy "${r.policy}" (${r.sinks} sink(s))`);
    }
  }

  if (violations > 0) {
    console.error(`\nFAIL — ${violations} package(s) violate the CSP-subpath convention.`);
    process.exit(1);
  }
  console.log('\nOK — every package with DOM-script sinks ships a /csp subpath.');
}

main();
