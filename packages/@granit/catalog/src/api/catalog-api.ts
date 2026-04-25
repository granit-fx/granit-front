import {
  createSavedView,
  deleteSavedView,
  getPage,
  getQueryMeta,
  listSavedViews,
  setDefaultSavedView,
  updateSavedView,
} from '@granit/query-engine';

import type {
  AddProductExternalMappingRequest,
  Product,
  ProductCreateRequest,
  ProductExternalMappingResponse,
  ProductListParams,
  ProductPage,
  ProductResponse,
  ProductUpdateRequest,
  UpdateProductMetadataRequest,
} from '../types.js';
import type {
  CreateSavedViewRequest,
  QueryMetadata,
  SavedViewSummary,
  UpdateSavedViewRequest,
} from '@granit/query-engine';
import type { AxiosInstance } from 'axios';

const PRODUCT_RECORDS_SUBPATH = 'product-records';

function productRecordsPath(basePath: string): string {
  return `${basePath}/${PRODUCT_RECORDS_SUBPATH}`;
}

// ---------------------------------------------------------------------------
// Read endpoints (business path: only Published products are listed)
// ---------------------------------------------------------------------------

/**
 * List published products available for purchase.
 *
 * `GET {basePath}/products`
 */
export async function listPublishedProducts(
  client: AxiosInstance,
  basePath: string
): Promise<readonly ProductResponse[]> {
  const response = await client.get<readonly ProductResponse[]>(`${basePath}/products`);
  return response.data;
}

/**
 * Get a product by its identifier (any lifecycle status).
 *
 * `GET {basePath}/products/{id}`
 */
export async function getProductById(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<ProductResponse> {
  const response = await client.get<ProductResponse>(
    `${basePath}/products/${encodeURIComponent(id)}`
  );
  return response.data;
}

/**
 * Get a product by its stable business SKU.
 *
 * `GET {basePath}/products/by-sku/{sku}`
 */
export async function getProductBySku(
  client: AxiosInstance,
  basePath: string,
  sku: string
): Promise<ProductResponse> {
  const response = await client.get<ProductResponse>(
    `${basePath}/products/by-sku/${encodeURIComponent(sku)}`
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Write endpoints
// ---------------------------------------------------------------------------

/**
 * Create a new product in `Draft` status.
 *
 * `POST {basePath}/products`
 */
export async function createProduct(
  client: AxiosInstance,
  basePath: string,
  request: ProductCreateRequest
): Promise<ProductResponse> {
  const response = await client.post<ProductResponse>(`${basePath}/products`, request);
  return response.data;
}

/**
 * Update editable fields of a `Draft` product.
 *
 * `PUT {basePath}/products/{id}`
 */
export async function updateProduct(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: ProductUpdateRequest
): Promise<ProductResponse> {
  const response = await client.put<ProductResponse>(
    `${basePath}/products/${encodeURIComponent(id)}`,
    request
  );
  return response.data;
}

/**
 * Replace all metadata of a product (any lifecycle status).
 *
 * `PUT {basePath}/products/{id}/metadata`
 */
export async function updateProductMetadata(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: UpdateProductMetadataRequest
): Promise<ProductResponse> {
  const response = await client.put<ProductResponse>(
    `${basePath}/products/${encodeURIComponent(id)}/metadata`,
    request
  );
  return response.data;
}

/**
 * Publish a `Draft` product, making it available for purchase.
 *
 * `POST {basePath}/products/{id}/publish`
 */
export async function publishProduct(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<ProductResponse> {
  const response = await client.post<ProductResponse>(
    `${basePath}/products/${encodeURIComponent(id)}/publish`
  );
  return response.data;
}

/**
 * Archive a `Published` product. Existing references are preserved for audit.
 *
 * `POST {basePath}/products/{id}/archive`
 */
export async function archiveProduct(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<ProductResponse> {
  const response = await client.post<ProductResponse>(
    `${basePath}/products/${encodeURIComponent(id)}/archive`
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// External mappings (provider sync — Stripe, Avalara, Odoo, ...)
// ---------------------------------------------------------------------------

/**
 * Add an external provider mapping to a product.
 *
 * `POST {basePath}/products/{id}/external-mappings`
 */
export async function addProductExternalMapping(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: AddProductExternalMappingRequest
): Promise<ProductExternalMappingResponse> {
  const response = await client.post<ProductExternalMappingResponse>(
    `${basePath}/products/${encodeURIComponent(id)}/external-mappings`,
    request
  );
  return response.data;
}

/**
 * Remove an external provider mapping from a product.
 *
 * `DELETE {basePath}/products/{id}/external-mappings/{mappingId}`
 */
export async function removeProductExternalMapping(
  client: AxiosInstance,
  basePath: string,
  id: string,
  mappingId: string
): Promise<void> {
  await client.delete(
    `${basePath}/products/${encodeURIComponent(id)}/external-mappings/${encodeURIComponent(mappingId)}`
  );
}

// ---------------------------------------------------------------------------
// QueryEngine — admin grid (all lifecycle statuses, filterable, exportable)
// ---------------------------------------------------------------------------

/**
 * List products via the QueryEngine endpoint (paginated, filterable).
 *
 * `GET {basePath}/product-records`
 */
export async function listProducts(
  client: AxiosInstance,
  basePath: string,
  params?: ProductListParams
): Promise<ProductPage> {
  return getPage<Product>(client, productRecordsPath(basePath), params ?? {});
}

/**
 * Get the QueryEngine metadata (columns, filterable fields, presets) for products.
 *
 * `GET {basePath}/product-records/meta`
 */
export async function getProductsQueryMeta(
  client: AxiosInstance,
  basePath: string
): Promise<QueryMetadata> {
  return getQueryMeta(client, productRecordsPath(basePath));
}

/**
 * List saved views for the products query endpoint.
 *
 * `GET {basePath}/product-records/saved-views`
 */
export async function listProductsSavedViews(
  client: AxiosInstance,
  basePath: string
): Promise<SavedViewSummary[]> {
  return listSavedViews(client, productRecordsPath(basePath));
}

/**
 * Create a saved view for the products query endpoint.
 *
 * `POST {basePath}/product-records/saved-views`
 */
export async function createProductsSavedView(
  client: AxiosInstance,
  basePath: string,
  request: CreateSavedViewRequest
): Promise<SavedViewSummary> {
  return createSavedView(client, productRecordsPath(basePath), request);
}

/**
 * Update a saved view on the products query endpoint.
 *
 * `PUT {basePath}/product-records/saved-views/{id}`
 */
export async function updateProductsSavedView(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: UpdateSavedViewRequest
): Promise<void> {
  await updateSavedView(client, productRecordsPath(basePath), id, request);
}

/**
 * Delete a saved view from the products query endpoint.
 *
 * `DELETE {basePath}/product-records/saved-views/{id}`
 */
export async function deleteProductsSavedView(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await deleteSavedView(client, productRecordsPath(basePath), id);
}

/**
 * Set a saved view as the default for the products query endpoint.
 *
 * `POST {basePath}/product-records/saved-views/{id}/set-default`
 */
export async function setDefaultProductsSavedView(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await setDefaultSavedView(client, productRecordsPath(basePath), id);
}
