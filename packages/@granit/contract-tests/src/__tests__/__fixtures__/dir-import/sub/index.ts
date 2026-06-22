// Fixture: a string-union enum reached through a directory import (`./sub`),
// which resolves via the `<dir>/index.ts` fallback in resolveModuleFile.
export type Kind = 'Alpha' | 'Beta';
