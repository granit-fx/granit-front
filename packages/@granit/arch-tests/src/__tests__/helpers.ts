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
 * `@tanstack/query-core`. No allowlisted debt remains.
 */
export const REACT_ECOSYSTEM_CORE_ALLOWLIST: ReadonlyArray<string> = [];

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
  '@granit/react-ui-authentication-federated',
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
  '@granit/react-ui-entities',
  '@granit/react-ui-error-boundary',
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
  '@granit/react-ui-timeline',
  '@granit/react-ui-webhooks',
];

/**
 * ADR-010 (strict 3-tier layering) — headless `@granit/react-{module}` packages
 * (prefixed `react-`, but NOT `react-ui-`) that currently pull the shadcn/`@granit/react-ui`
 * stack BELOW the UI tier, either via a runtime import in `src/` or via a
 * (peer)dependency declaration. The rule: the UI stack must live at the UI tier only, so a
 * headless adapter package stays framework/design-system-agnostic and composable by any
 * UI shell (web shadcn today, React Native / a different design system tomorrow). The
 * banned surface is the barrel `@granit/react-ui` (incl. subpaths) plus the shadcn
 * primitives it re-exports: `radix-ui` / `@radix-ui/*`, `cmdk`, `sonner`,
 * `class-variance-authority`, `vaul`. This is a RATCHET baseline: no NEW package may be
 * added, and it must only ever SHRINK to `[]` as the open extraction PRs land
 * (#878/#880/#881/#882 — analytics/geocoding/entity-merge extracted, rich-text renamed to
 * `react-ui-rich-text`). It is already EMPTY on develop: those PRs have merged, so the
 * baseline documents zero remaining debt and any regression fails immediately. Note: the
 * former `react-map` package composed `@granit/react-ui-analytics` (a UI package) and was
 * renamed to `@granit/react-ui-map` (ADR-010 follow-up); as a `react-ui-*` package it now
 * lives at the UI tier and is correctly out of scope for this headless-only rule.
 * Regenerate: for each `packages/@granit/react-*` package that is NOT `react-ui-*`, grep
 * `src` (excluding test/stories) for the banned specifiers and inspect its
 * peer/dependencies; map hits to package names, sort -u.
 */
export const UI_STACK_BELOW_TIER_BASELINE: ReadonlyArray<string> = [];

/**
 * Storybook coverage ratchet (checklist 7f) — per `react-ui-*` package, the number
 * of `*-page.tsx` / `*-dialog.tsx` components that currently LACK a co-located
 * same-name `*.stories.tsx`. The test asserts each package stays at or below its
 * budget, so no NEW page/dialog may ship without a story; lower a number whenever a
 * story is added (the budget must only ever SHRINK). A package absent from this map
 * must have ZERO storyless pages/dialogs (default budget 0). Regenerate the counts
 * from the same scan as checklist 7f (`*-page.tsx`/`*-dialog.tsx` without a sibling
 * `.stories.tsx`, per package).
 */
export const STORYBOOK_PAGE_BUDGET: Readonly<Record<string, number>> = {
  '@granit/react-ui-account': 8,
  '@granit/react-ui-kit': 1,
  '@granit/react-ui-ai': 4,
  '@granit/react-ui-ai-chat': 2,
  '@granit/react-ui-ai-prompts': 1,
  '@granit/react-ui-authentication-federated': 1,
  '@granit/react-ui-authentication-local': 7,
  '@granit/react-ui-authorization': 4,
  '@granit/react-ui-background-jobs': 1,
  '@granit/react-ui-blob-storage': 1,
  '@granit/react-ui-catalog': 3,
  '@granit/react-ui-cms-hostnames': 1,
  '@granit/react-ui-cms-pages': 1,
  '@granit/react-ui-cms-redirects': 1,
  '@granit/react-ui-cms-releases': 2,
  '@granit/react-ui-customer-balance': 1,
  '@granit/react-ui-dashboards': 3,
  '@granit/react-ui-data-exchange': 2,
  '@granit/react-ui-diagnostics': 1,
  '@granit/react-ui-documents': 8,
  '@granit/react-ui-entities': 3,
  '@granit/react-ui-features': 2,
  '@granit/react-ui-hostnames': 1,
  '@granit/react-ui-identity': 7,
  '@granit/react-ui-invoicing': 2,
  '@granit/react-ui-localization': 2,
  '@granit/react-ui-metering': 3,
  '@granit/react-ui-multi-tenancy': 3,
  '@granit/react-ui-notifications': 2,
  '@granit/react-ui-parties': 13,
  '@granit/react-ui-payments': 4,
  '@granit/react-ui-privacy': 9,
  '@granit/react-ui-scheduling': 2,
  '@granit/react-ui-settings': 1,
  '@granit/react-ui-shell-admin': 1,
  '@granit/react-ui-subscriptions': 4,
  '@granit/react-ui-tax': 2,
  '@granit/react-ui-templating': 3,
  '@granit/react-ui-webhooks': 3,
};

/**
 * Logging hygiene (checklist 5d) — packages allowed to call `createLogger()` more than
 * once (duplicate instances of the same prefix). The convention is ONE logger per
 * package in `src/logger.ts`, imported everywhere (see `@granit/react-ui-bff`). This
 * ratchet is now EMPTY — every package has a single logger; no NEW package may
 * reintroduce a duplicate. Keep it empty unless a deliberate, documented exception
 * arises.
 */
export const LOGGER_MULTI_INSTANCE_BASELINE: ReadonlyArray<string> = [];
