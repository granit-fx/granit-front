import type { EntityId } from '@granit/types';

/** Branded product identifier. */
export type ProductId = EntityId<'Product'>;

/** Branded product external mapping identifier. */
export type ProductExternalMappingId = EntityId<'ProductExternalMapping'>;

/**
 * Lifecycle status of a catalog product. Mirrors the reachable subset of
 * `Granit.Workflow.Domain.WorkflowLifecycleStatus` for `Product`: the entity's
 * state machine is `Draft → Published → Archived` (it never enters
 * `PendingReview`).
 */
export type ProductLifecycleStatus = 'Draft' | 'Published' | 'Archived';

/**
 * Coarse product classification. Mirrors `Granit.Catalog.Domain.ProductType`
 * (serialized to its string name). Drives downstream behavior (tax, shipping,
 * metering).
 */
export type ProductType = 'Service' | 'Metered' | 'Physical' | 'Digital';

/** Product external provider mapping (Stripe, Avalara, Odoo, ...). */
export interface ProductExternalMappingResponse {
  readonly id: ProductExternalMappingId;
  readonly providerName: string;
  readonly externalId: string;
}

/** Catalog product entry. Mirrors `Granit.Catalog.Endpoints.Dtos.ProductResponse`. */
export interface ProductResponse {
  readonly id: ProductId;
  readonly sku: string;
  readonly name: string;
  readonly description: string | null;
  /** Product classification (`Service`, `Metered`, `Physical`, `Digital`). */
  readonly type: ProductType;
  /** Unit of measure (e.g. `each`, `hour`). */
  readonly unit: string;
  readonly lifecycleStatus: ProductLifecycleStatus;
  readonly metadata: Readonly<Record<string, string>>;
  readonly externalMappings: readonly ProductExternalMappingResponse[];
}

/** Request to create a new product (always created in Draft status). */
export interface ProductCreateRequest {
  readonly sku: string;
  readonly name: string;
  readonly type: ProductType;
  readonly unit: string;
  readonly description?: string | null;
}

/** Request to update editable fields of a Draft product. */
export interface ProductUpdateRequest {
  readonly name: string;
  readonly unit: string;
  readonly description: string | null;
}

/**
 * Request to replace all metadata of a product. MUST NOT contain PII —
 * audit logs and exports surface this content.
 */
export interface UpdateProductMetadataRequest {
  readonly metadata: Readonly<Record<string, string>>;
}

/** Request to add an external provider mapping to a product. */
export interface AddProductExternalMappingRequest {
  readonly providerName: string;
  readonly externalId: string;
}
