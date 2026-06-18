// Fixture: a shared, aggregate-agnostic generic kept in its own module (the
// `@granit/entity-merge` pattern). Specialised by a consumer via a branded id.
export interface Envelope<TId extends string = string> {
  readonly ownerId: TId;
  readonly note: string | null;
}
