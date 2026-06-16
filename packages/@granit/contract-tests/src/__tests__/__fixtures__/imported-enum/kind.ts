// Fixture: a string-union enum kept in its own file (the codebase convention).
// Imported by ./dto.ts so the oracle must follow the import to resolve `kind`
// to `string` instead of defaulting an unresolved reference to `object`.
export type Kind = 'Alpha' | 'Beta' | 'Gamma';
