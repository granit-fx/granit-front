// Public API. Consumers wire their own Vitest (or Jest) `describe/it` blocks
// around these scanners — the kit only does the analysis, not the assertion.

export { walkSourceFiles, isTestFile, isTestingDir, rel, readFile, stripComments } from './fs.js';
export type { Module, ScanContext, AllowlistedScanContext, Violation } from './types.js';

export {
  scanKebabCase,
  scanHookNaming,
  scanComponentNaming,
  scanFetchVerbInApi,
} from './scanners/naming.js';

export {
  collectImports,
  scanConsole,
  scanFetch,
  scanAxiosImports,
  scanOnlySkip,
} from './scanners/imports.js';

export { scanBarrelDefaultExports, scanLeakedInternals } from './scanners/barrels.js';
export type { BarrelScanOptions } from './scanners/barrels.js';

export { scanLocaleParity } from './scanners/i18n.js';
