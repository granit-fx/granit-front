// Public API. Consumers wire their own Vitest (or Jest) `describe/it` blocks
// around these scanners — the kit only does the analysis, not the assertion.

export { walkSourceFiles, isTestFile, isTestingDir, rel, readFile, stripComments } from './fs';
export type { Module, ScanContext, AllowlistedScanContext, Violation } from './types';

export {
  scanKebabCase,
  scanHookNaming,
  scanComponentNaming,
  scanFetchVerbInApi,
} from './scanners/naming';

export {
  collectImports,
  hasBannedConsole,
  scanConsole,
  scanFetch,
  scanAxiosImports,
  scanOnlySkip,
} from './scanners/imports';

export { scanBarrelDefaultExports, scanLeakedInternals } from './scanners/barrels';
export type { BarrelScanOptions } from './scanners/barrels';

export { scanLocaleParity } from './scanners/i18n';

export {
  scanAnonymousDefaultExports,
  scanWallClockInApi,
  scanUseFormResolver,
} from './scanners/patterns';

export { scanReadmePresence, scanSharedDepVersions } from './scanners/uniformity';
export type { ReadmePresenceOptions, SharedDepVersionsOptions } from './scanners/uniformity';
