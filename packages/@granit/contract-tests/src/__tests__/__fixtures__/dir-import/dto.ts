import type { Kind } from './sub';

// Fixture DTO whose `kind` is typed via an enum re-exported from a sibling
// directory's index.ts — exercises the directory-index branch of module
// resolution.
export interface Sample {
  readonly kind: Kind;
}
