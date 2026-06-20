/**
 * A resolved `@`-mention candidate from the Granit mention picker
 * (`GET /lookups/mentions`). A mention has **no dedicated wire contract** — it is a
 * `Granit.DataLookup` item whose composite `value` (`"<type>:<id>"`) and source-specific
 * `extra` are normalized here. Consumers project this onto their own option shape.
 */
export interface MentionItem {
  /** Mention type discriminator (e.g. `user`), from the item's `extra.type` or value prefix. */
  readonly type: string;
  /** Opaque entity id — the part of the composite value after the first `:`. */
  readonly id: string;
  /** Already-localized display label, rendered verbatim. */
  readonly label: string;
  /** Source-specific secondary attributes (e.g. `{ email }`), or `null` when none. */
  readonly extra: Readonly<Record<string, unknown>> | null;
}
