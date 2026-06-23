import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Module } from '@granit/arch-tests-kit';

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, '../../../../..');
export const PACKAGES_DIR = path.join(REPO_ROOT, 'packages/@granit');

/** Self — never test the arch test packages themselves. */
const EXCLUDED_DIRS = new Set(['arch-tests', 'arch-tests-kit']);

export interface PackageInfo extends Module {
  dirName: string;
  packageJsonPath: string;
  packageJson: Record<string, unknown>;
}

export function listPackages(): PackageInfo[] {
  return fs
    .readdirSync(PACKAGES_DIR)
    .filter((d) => {
      if (EXCLUDED_DIRS.has(d)) return false;
      const full = path.join(PACKAGES_DIR, d);
      return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, 'package.json'));
    })
    .map((dirName) => {
      const dir = path.join(PACKAGES_DIR, dirName);
      const packageJsonPath = path.join(dir, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as Record<
        string,
        unknown
      >;
      return {
        name: (packageJson.name as string) ?? `@granit/${dirName}`,
        dirName,
        dir,
        srcDir: path.join(dir, 'src'),
        packageJsonPath,
        packageJson,
        isReact: dirName.startsWith('react-'),
      };
    });
}

/** Convenience: project a PackageInfo into the kit's Module shape. */
export function toModules(pkgs: ReadonlyArray<PackageInfo>): Module[] {
  return pkgs.map(({ name, dir, srcDir, isReact }) => ({ name, dir, srcDir, isReact }));
}

/** Packages that legitimately use the native Fetch API (sit below axios). */
export const FETCH_ALLOWLIST: ReadonlyArray<string> = [
  '@granit/bff',
  '@granit/react-bff',
  '@granit/react-ui-bff',
  '@granit/logger-otlp',
  '@granit/react-tracing',
  '@granit/notifications-sse',
  '@granit/api-client',
];

/** Packages whose code may import the `axios` module directly. */
export const AXIOS_ALLOWLIST: ReadonlyArray<string> = ['@granit/api-client'];

/** logger + transports own the createLogger façade (or fall back to console). */
export const CONSOLE_ALLOWLIST: ReadonlyArray<string> = [
  '@granit/logger',
  '@granit/logger-otlp',
  '@granit/react-tracing',
];

/**
 * Packages imported by a React Server Components app (the Next.js CMS renderer).
 * Files in these using a client-only React hook must carry `'use client'`.
 * Discover with:
 *   grep -rhoE "@granit/react-[a-z0-9-]+" ~/dev/granit-fx/granit-cms-renderer/{app,src}
 */
export const RSC_PACKAGES: ReadonlyArray<string> = ['@granit/react-cms'];

/**
 * R1 (checklist 7g) — framework-agnostic (non-`react-`) packages must not import the
 * React ecosystem (`react`, `react-dom`, `@tanstack/react-query`) so a future
 * non-React adapter can reuse the core. The framework-neutral query core is
 * `@tanstack/query-core`. Allowlisted debt:
 *   @granit/shell-core — `src/query-client.ts` still imports `@tanstack/react-query`
 *   (migrate to `@tanstack/query-core`).
 */
export const REACT_ECOSYSTEM_CORE_ALLOWLIST: ReadonlyArray<string> = ['@granit/shell-core'];

/**
 * R3 (checklist 7g) — `react-ui-*` packages that currently import a web router
 * (`react-router` / `react-router-dom`) directly in runtime code. This is a RATCHET
 * baseline: no NEW package may be added, and it should SHRINK as pages move
 * navigation behind a port/props so React Native (react-navigation) or Angular
 * Router can substitute. Regenerate from the R3 scan in checklist 7g: grep the
 * `react-router` imports under each `react-ui-` package src (excluding test and
 * stories files), map each hit to its `@granit/react-ui-…` package name, sort -u.
 */
export const UI_ROUTER_BASELINE: ReadonlyArray<string> = [
  '@granit/react-ui-account',
  '@granit/react-ui-ai',
  '@granit/react-ui-ai-chat',
  '@granit/react-ui-auditing',
  '@granit/react-ui-authentication-api-keys',
  '@granit/react-ui-authentication-local',
  '@granit/react-ui-catalog',
  '@granit/react-ui-cms-hostnames',
  '@granit/react-ui-cms-menus',
  '@granit/react-ui-cms-pages',
  '@granit/react-ui-cms-redirects',
  '@granit/react-ui-cms-releases',
  '@granit/react-ui-cms-seo',
  '@granit/react-ui-cms-sites',
  '@granit/react-ui-dashboards',
  '@granit/react-ui-documents',
  '@granit/react-ui-features',
  '@granit/react-ui-hostnames',
  '@granit/react-ui-identity',
  '@granit/react-ui-invoicing',
  '@granit/react-ui-metering',
  '@granit/react-ui-multi-tenancy',
  '@granit/react-ui-notifications',
  '@granit/react-ui-openiddict-admin',
  '@granit/react-ui-parties',
  '@granit/react-ui-payments',
  '@granit/react-ui-privacy',
  '@granit/react-ui-reference-data',
  '@granit/react-ui-scheduling',
  '@granit/react-ui-shell-admin',
  '@granit/react-ui-subscriptions',
  '@granit/react-ui-tax',
  '@granit/react-ui-taxonomy',
  '@granit/react-ui-templating',
  '@granit/react-ui-webhooks',
];
