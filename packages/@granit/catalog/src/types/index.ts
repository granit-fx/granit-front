import type { EntityId } from '@granit/types';

/** Branded product identifier. */
export type ProductId = EntityId<'Product'>;

/** Branded product external mapping identifier. */
export type ProductExternalMappingId = EntityId<'ProductExternalMapping'>;

/**
 * Lifecycle status of a catalog product. Mirrors
 * `Granit.Workflow.Domain.WorkflowLifecycleStatus` string values.
 */
export type ProductLifecycleStatus = 'Draft' | 'Published' | 'Archived';

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
  /** Free-form product type (e.g. `Service`, `Good`). Backend string. */
  readonly type: string;
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
  readonly type: string;
  readonly unit: string;
  readonly description?: string | null;
}

/** Request to update editable fields of a Draft product. */
export interface ProductUpdateRequest {
  readonly name: string;
  readonly description: string | null;
  readonly unit: string;
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
