import { type Options, defineConfig } from 'tsup';

/**
 * Shared tsup preset for all @granit/* packages.
 *
 * Centralizes:
 * - ESM-only output
 * - DTS generation via tsconfig.build.json
 * - TS 6 `ignoreDeprecations` workaround (tsup injects deprecated `baseUrl` internally)
 * - External pattern for @granit/* peer dependencies
 *
 * @param overrides - Package-specific options (entry, external, splitting, etc.)
 */
export function createTsupConfig(overrides?: Partial<Options>) {
  return defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: {
      tsconfig: '../../../tsconfig.build.json',
      compilerOptions: { ignoreDeprecations: '6.0' },
    },
    clean: true,
    external: [/^@granit\//],
    ...overrides,
  });
}
