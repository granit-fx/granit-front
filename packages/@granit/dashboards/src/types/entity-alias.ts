/**
 * How an {@link EntityAlias} resolves to a concrete entity at render time.
 * Mirrors `Granit.Dashboards.EntityAliasResolver` (5 base kinds; the
 * proposed RelationGraphResolver is deferred to its own ADR).
 *
 * JSON polymorphism uses the `kind` discriminator with kebab-case tags
 * (matches the `Datasource` discriminator convention).
 */
export type EntityAliasResolver =
  | RouteParamResolver
  | ViewEntityResolver
  | TenantContextResolver
  | UserSelectionResolver
  | StaticEntityResolver;

/**
 * Pulls the entity id from a URL / route parameter — typical for "open
 * this dashboard for entity X" patterns where the parent route owns the
 * binding.
 */
export interface RouteParamResolver {
  readonly kind: 'route-param';
  /** Route parameter name (e.g. `"id"`, `"customerId"`). */
  readonly paramName: string;
}

/**
 * Pulls the entity id from the active `DashboardView`'s parameters —
 * the bridge between the view stack (P2.1) and aliases. When a row click
 * in a list view pushes a new view onto the stack with `entityId` in its
 * params, the alias re-resolves automatically.
 */
export interface ViewEntityResolver {
  readonly kind: 'view-entity';
  /** Slot name in the view's params dictionary. Backend default: `"entityId"`. */
  readonly paramName: string;
}

/**
 * Resolves to the current authenticated tenant — single entity. Carries
 * no payload; the runtime reads `ICurrentTenant` at render time.
 */
export interface TenantContextResolver {
  readonly kind: 'tenant-context';
}

/**
 * Renders a picker; the user selects one (or many) entities at runtime.
 */
export interface UserSelectionResolver {
  readonly kind: 'user-selection';
  /** Granit.DataLookup name backing the picker. */
  readonly lookupName: string;
  /** When `true`, the picker accepts a multi-selection set. */
  readonly multiSelect?: boolean;
}

/**
 * Hard-coded entity reference. Mostly for testing or "global" widgets
 * pinned to a known operator-level entity.
 */
export interface StaticEntityResolver {
  readonly kind: 'static';
  /** Stringified entity identifier. */
  readonly entityId: string;
}

/**
 * Named entity binding declared by a `DashboardDefinition` and resolved
 * at render time by an {@link EntityAliasResolver}. Mirrors
 * `Granit.Dashboards.EntityAlias` (P2.3).
 *
 * Lets the same dashboard render against different entities (a single
 * Customer, a chosen Device, the current Tenant, …) without duplicating
 * the definition.
 */
export interface EntityAlias {
  /**
   * Alias identifier referenced from data sources (e.g. `"currentCustomer"`,
   * `"selectedDevice"`). Camel-case, unique within the dashboard.
   */
  readonly name: string;
  /**
   * Logical type the alias resolves to (`"Customer"`, `"Device"`,
   * `"Invoice"`, ...).
   */
  readonly entityType: string;
  /** Resolution strategy. */
  readonly resolver: EntityAliasResolver;
}

/** Type guards for narrowing an {@link EntityAliasResolver} to a specific variant. */
export function isRouteParamResolver(r: EntityAliasResolver): r is RouteParamResolver {
  return r.kind === 'route-param';
}
export function isViewEntityResolver(r: EntityAliasResolver): r is ViewEntityResolver {
  return r.kind === 'view-entity';
}
export function isTenantContextResolver(r: EntityAliasResolver): r is TenantContextResolver {
  return r.kind === 'tenant-context';
}
export function isUserSelectionResolver(r: EntityAliasResolver): r is UserSelectionResolver {
  return r.kind === 'user-selection';
}
export function isStaticEntityResolver(r: EntityAliasResolver): r is StaticEntityResolver {
  return r.kind === 'static';
}
