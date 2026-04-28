/**
 * Kind of backing source behind a {@link LookupDescriptor}. Informational — the
 * frontend can use it to pick an affordance (e.g., compact list for `Enum`
 * vs. debounced typeahead for `QueryEngine`).
 */
export type LookupKind = 'QueryEngine' | 'Simple' | 'ReferenceData' | 'Enum';

/**
 * Declarative pointer to a lookup data source. Emitted by the backend alongside
 * filterable-field metadata (`FilterableField.lookup`) and consumed directly by
 * the frontend to render a typeahead picker.
 *
 * Exactly one of `name` or `endpoint` must be provided:
 * - `name`: resolved against the central `/lookups/{name}` registry
 *   (preferred).
 * - `endpoint`: absolute or relative URL for a bespoke source that returns the
 *   canonical {@link LookupResult} shape.
 */
export interface LookupDescriptor {
  /** Registry key of the lookup source (e.g. `"tenants"`). */
  readonly name?: string;
  /** Custom URL when bypassing the registry. Must return {@link LookupResult}. */
  readonly endpoint?: string;
  /** Kind of backing source. */
  readonly kind?: LookupKind;
  /** Permission the caller must hold to open the picker. */
  readonly requiredPermission?: string;
  /** Query string parameter name used to forward the typeahead term. Default: `"search"`. */
  readonly searchParam?: string;
  /**
   * Names of scope parameters the source requires (e.g. `["tenantId"]`). The
   * frontend resolves the values from the surrounding form/filter context and
   * passes them as `scope.<key>=<value>` query-string parameters. When any
   * declared key is missing, the frontend MUST suppress the request (see
   * Empty Scope Trap mitigation in {@link useLookup}).
   */
  readonly scopeKeys?: readonly string[];
}
