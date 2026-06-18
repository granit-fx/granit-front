import type { Envelope } from './generic';

// Fixture: a branded id alias + a DTO declared as a generic specialisation of a
// type imported from a sibling module. The oracle must follow the import,
// flatten `Envelope`, and bind `TId` → `OwnerId` (a branded string) so
// `ownerId` resolves to `string` rather than an unresolved `object`.
type OwnerId = string & { readonly __brand: 'Owner' };

export type OwnerEnvelopeResponse = Envelope<OwnerId>;
