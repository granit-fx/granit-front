import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';

import type { StorybookConfig } from '@storybook/react-vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGES = path.resolve(dirname, '../packages/@granit');

/**
 * Auto-discover @granit/* source aliases (mirrors the showcase's
 * buildGranitAliases). Every package resolves to its real `src` entry so a
 * story, its decorators and the component under test all share a single module
 * instance — otherwise a provider mounted by a decorator and a hook called by
 * the component would see two distinct createContext() instances and context
 * lookups would return null.
 *
 * Subpath entries (`/testing`, `/csp`, `/base.css`) are pushed before the bare
 * package entry so the greedy string alias doesn't swallow them.
 */
function buildGranitAliases(): Array<{ find: string; replacement: string }> {
  if (!fs.existsSync(PACKAGES)) return [];

  const aliases: Array<{ find: string; replacement: string }> = [];
  for (const pkgName of fs.readdirSync(PACKAGES)) {
    const pkgDir = path.join(PACKAGES, pkgName);
    if (!fs.statSync(pkgDir).isDirectory()) continue;

    for (const sub of ['testing', 'msw', 'csp', 'editor', 'usage', 'test-utils'] as const) {
      const candidate = [`src/${sub}/index.ts`, `src/${sub}.ts`]
        .map((p) => path.join(pkgDir, p))
        .find((p) => fs.existsSync(p));
      if (candidate) aliases.push({ find: `@granit/${pkgName}/${sub}`, replacement: candidate });
    }

    const baseCss = path.join(pkgDir, 'src/base.css');
    if (fs.existsSync(baseCss))
      aliases.push({ find: `@granit/${pkgName}/base.css`, replacement: baseCss });

    const index = path.join(pkgDir, 'src/index.ts');
    if (fs.existsSync(index)) aliases.push({ find: `@granit/${pkgName}`, replacement: index });
  }
  return aliases;
}

const config: StorybookConfig = {
  stories: [
    '../packages/@granit/*/src/**/*.stories.@(ts|tsx)',
    '../.storybook/docs/**/*.stories.@(ts|tsx)',
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    'msw-storybook-addon',
  ],
  framework: '@storybook/react-vite',
  docs: {
    defaultName: 'Documentation',
  },
  viteFinal: (cfg) => {
    cfg.plugins ??= [];
    cfg.plugins.push(tailwindcss());

    const granitAliases = buildGranitAliases();
    cfg.resolve ??= {};
    const existing: Array<{ find: string | RegExp; replacement: string }> = Array.isArray(
      cfg.resolve.alias
    )
      ? (cfg.resolve.alias as Array<{ find: string | RegExp; replacement: string }>)
      : Object.entries(cfg.resolve.alias ?? {}).map(([find, replacement]) => ({
          find,
          replacement: replacement as string,
        }));
    // First-match-wins: our source aliases must precede any node_modules entry.
    cfg.resolve.alias = [...granitAliases, ...existing];

    // Single instance of context-bearing libraries served from package source.
    cfg.resolve.dedupe = [
      ...(cfg.resolve.dedupe ?? []),
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@tanstack/react-table',
      'cmdk',
    ];

    // TS source packages are served directly; pre-bundling them would create a
    // second module instance.
    cfg.optimizeDeps ??= {};
    cfg.optimizeDeps.exclude = [
      ...(cfg.optimizeDeps.exclude ?? []),
      ...granitAliases.filter((a) => !a.find.includes('/')).map((a) => a.find),
    ];

    return cfg;
  },
};

export default config;
