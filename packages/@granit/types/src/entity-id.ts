/**
 * Branded type for entity identifiers, parameterized by entity name.
 *
 * Prevents accidental parameter inversion at compile time:
 * ```ts
 * // Compile error — InvoiceId is not assignable to TenantId
 * api.getInvoice(tenantId, invoiceId);
 * ```
 *
 * @typeParam Brand - Entity name used as the brand discriminator (e.g. `'User'`, `'Invoice'`).
 */
export type EntityId<Brand extends string> = string & {
  readonly __entity: Brand;
};

/**
 * Casts a plain string to a branded {@link EntityId}.
 *
 * No runtime validation — the caller is responsible for ensuring the value
 * is a valid identifier.
 *
 * @example
 * ```ts
 * const userId = toEntityId<'User'>('550e8400-e29b-41d4-a716-446655440000');
 * ```
 */
export function toEntityId<Brand extends string>(value: string): EntityId<Brand> {
  return value as EntityId<Brand>;
}

// ── Cross-cutting entity IDs ────────────────────────────────────────────────

/** User identifier — used across identity, notifications, auditing, subscriptions, etc. */
export type UserId = EntityId<'User'>;

/** Tenant identifier — used across multi-tenancy, auditing, payments, webhooks, etc. */
export type TenantId = EntityId<'Tenant'>;

/** Correlation identifier — used for distributed tracing across scheduling, auditing, etc. */
export type CorrelationId = EntityId<'Correlation'>;
