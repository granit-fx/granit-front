// ---------------------------------------------------------------------------
// @granit/react-reference-data/testing — fixture builder
//
// A `ReferenceDataResponse` has 15 localized label slots plus a validity window,
// a hierarchy pointer and a metadata bag. Written out literally, a seed entry is
// ~16 lines of which only 4 or 5 carry meaning. `makeReferenceDataEntry` keeps
// the meaningful ones and defaults the rest.
// ---------------------------------------------------------------------------

import { toEntityId } from '@granit/types';

import { emptyLabels } from './handlers';

import type { ReferenceDataResponse } from '@granit/reference-data';

/**
 * What a fixture has to state, for an entity `T` that extends the base response:
 * its identity (`id`, `code`), every field `T` adds on top of the base, and
 * whichever base fields it wants to override.
 */
export type ReferenceDataEntrySeed<T extends ReferenceDataResponse = ReferenceDataResponse> = {
  readonly id: string;
  readonly code: string;
} & Partial<Omit<ReferenceDataResponse, 'id' | 'code'>> &
  Omit<T, keyof ReferenceDataResponse>;

const ENTRY_DEFAULTS = {
  label: '',
  ...emptyLabels,
  sortOrder: 0,
  activated: true,
  validFrom: null,
  validTo: null,
  parentCode: null,
  metadata: null,
} as const;

/**
 * Build a reference-data fixture from the fields that actually distinguish it.
 *
 * Defaults: all 15 labels empty, `sortOrder` 0, `activated` true, no validity
 * window, no parent, no metadata — override any of them by stating them.
 *
 * ```ts
 * const invoice = makeReferenceDataEntry({
 *   id: 'bd85759d-a3a1-584e-be05-6b1f605ccad2',
 *   code: 'INVOICE',
 *   labelEn: 'Invoice',
 *   labelFr: 'Facture',
 *   sortOrder: 1,
 * });
 *
 * // For an entity that extends the base, name it — its own fields stay required:
 * const france = makeReferenceDataEntry<Country>({ id, code: 'FR', alpha3: 'FRA', … });
 * ```
 */
export function makeReferenceDataEntry<T extends ReferenceDataResponse = ReferenceDataResponse>(
  seed: ReferenceDataEntrySeed<T>
): T {
  const { id, ...rest } = seed;
  // The spread is what makes this well-typed at the call site; TypeScript cannot
  // prove the merge covers `T`, which `ReferenceDataEntrySeed<T>` guarantees.
  return {
    ...ENTRY_DEFAULTS,
    ...rest,
    id: toEntityId<'ReferenceDataResponse'>(id),
  } as unknown as T;
}
