import type { PagedResult, QueryRequest } from '@granit/query-engine';
import type { EntityId, ISODateString, TenantId } from '@granit/types';

/** Branded identifier for a catalog product. */
export type ProductId = EntityId<'Product'>;

/** Branded identifier for a product's external provider mapping. */
export type ProductExternalMappingId = EntityId<'ProductExternalMapping'>;

/**
 * Coarse classification of a product. Drives downstream behavior
 * (tax codes, shipping, metering integration).
 */
export type ProductType = 'Service' | 'Metered' | 'Physical' | 'Digital';

/** Workflow lifecycle status (mirrors Granit.Workflow). */
export type ProductLifecycleStatus = 'Draft' | 'Published' | 'Archived';

/**
 * Optional reference to an external provider's product identifier
 * (Stripe, Avalara, Odoo, ...). One row per provider.
 */
export interface ProductExternalMappingResponse {
  readonly id: ProductExternalMappingId;
  readonly providerName: string;
  readonly externalId: string;
}

/** A catalog product as returned by the read endpoints. */
export interface ProductResponse {
  readonly id: ProductId;
  readonly sku: string;
  readonly name: string;
  readonly description: string | null;
  readonly type: ProductType;
  readonly unit: string;
  readonly lifecycleStatus: ProductLifecycleStatus;
  readonly metadata: Readonly<Record<string, string>>;
  readonly externalMappings: readonly ProductExternalMappingResponse[];
}

/** Request to create a new product in `Draft` status. */
export interface ProductCreateRequest {
  readonly sku: string;
  readonly name: string;
  readonly type: ProductType;
  readonly unit: string;
  readonly description?: string | null;
}

/** Request to update editable fields of a `Draft` product. */
export interface ProductUpdateRequest {
  readonly name: string;
  readonly description: string | null;
  readonly unit: string;
}

/**
 * Request to replace all metadata of a product (any lifecycle status).
 * Backend MUST NOT contain PII (audit logs and exports surface this content).
 */
export interface UpdateProductMetadataRequest {
  readonly metadata: Readonly<Record<string, string>>;
}

/** Request to add an external provider mapping to a product. */
export interface AddProductExternalMappingRequest {
  readonly providerName: string;
  readonly externalId: string;
}

// ---------------------------------------------------------------------------
// QueryEngine entity (admin grid: filter / sort / paginate / export)
// ---------------------------------------------------------------------------

/**
 * Product entity as returned by the QueryEngine endpoint
 * (`GET /catalog/product-records`). Distinct from {@link ProductResponse}:
 * the query endpoint returns the raw entity (including audit columns) without
 * the `metadata` / `externalMappings` projections applied by the CRUD endpoints.
 */
export interface Product {
  readonly id: ProductId;
  readonly tenantId: TenantId | null;
  readonly sku: string;
  readonly name: string;
  readonly description: string | null;
  readonly type: ProductType;
  readonly unit: string;
  readonly lifecycleStatus: ProductLifecycleStatus;
  readonly createdAt: ISODateString;
  readonly modifiedAt: ISODateString;
}

/** Paginated page of {@link Product} entities. */
export type ProductPage = PagedResult<Product>;

/** Query parameters accepted by `GET /catalog/product-records`. */
export type ProductListParams = QueryRequest;
