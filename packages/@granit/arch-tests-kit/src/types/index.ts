/** One unit to scan — a framework package, a feature folder in an app, etc. */
export interface Module {
  /** Human-readable identifier used in violation messages. */
  name: string;
  /** Absolute path to the module directory. */
  dir: string;
  /**
   * Absolute path to the module's source root. Defaults to `dir` (for apps
   * where each "module" is itself a source folder) or `dir + '/src'` when
   * scanning npm packages.
   */
  srcDir: string;
  /** Marks React-flavored modules so a few naming rules apply differently. */
  isReact?: boolean;
}

/** A single architectural violation found by a scanner. */
export interface Violation {
  /** Stable rule identifier (e.g. `kebab-case`, `no-console`). */
  rule: string;
  /** Module name where the violation was found. */
  module: string;
  /** File path, relative to `repoRoot`. */
  file: string;
  /** Human-readable explanation, ready to surface in an assertion message. */
  message: string;
}

/** Context shared by every scanner. */
export interface ScanContext {
  modules: ReadonlyArray<Module>;
  /** Used to make {@link Violation.file} paths relative and readable. */
  repoRoot: string;
}

/** Allows callers to exempt specific modules or individual files from a rule. */
export interface AllowlistedScanContext extends ScanContext {
  allowedModules?: ReadonlyArray<string>;
  /**
   * Relative file paths (matched as substrings against {@link Violation.file})
   * to exempt — useful when a single file in an otherwise-clean module needs
   * to opt out (e.g. auth bootstrap that legitimately calls fetch()).
   */
  allowedFiles?: ReadonlyArray<string>;
}
