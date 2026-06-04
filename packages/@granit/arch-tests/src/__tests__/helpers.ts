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
