import type { Kind } from './kind';

// Fixture DTO: `kind` is typed via an enum imported from a sibling file.
export interface Sample {
  readonly kind: Kind;
}
