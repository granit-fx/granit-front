import type {
  AddProductExternalMappingRequest,
  ProductCreateRequest,
  ProductExternalMappingId,
  ProductId,
  ProductResponse,
  ProductUpdateRequest,
  UpdateProductMetadataRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { PagedResult } from '@granit/query-engine';

/**
 * Lists the active product catalog (Published status only).
 *
 * `GET {basePath}/products/active` — returns a `{ items, totalCount }` envelope
 * (mirrors the backend `ListProductsResponse`; structurally a `PagedResult`).
 *
 * The bare `GET {basePath}/products` route is the `Products.Manage`-gated
 * query-engine admin grid (paginated, full lifecycle) — consume it via
 * `@granit/react-query-engine`, not this function.
 */
export async function listActiveProducts(
  client: AxiosInstance,
  basePath: string
): Promise<PagedResult<ProductResponse>> {
  const { data } = await client.get<PagedResult<ProductResponse>>(`${basePath}/products/active`);
  return data;
}

/**
 * Fetches a product by id (any lifecycle status).
 *
 * `GET {basePath}/products/{id}`
 */
export async function getProductById(
  client: AxiosInstance,
  basePath: string,
  id: ProductId
): Promise<ProductResponse> {
  const { data } = await client.get<ProductResponse>(
    `${basePath}/products/${encodeURIComponent(id)}`
  );
  return data;
}

/**
 * Fetches a product by SKU (any lifecycle status). Used for reverse lookups
 * during Stripe / Avalara / Odoo integration syncs.
 *
 * `GET {basePath}/products/by-sku/{sku}`
 */
export async function getProductBySku(
  client: AxiosInstance,
  basePath: string,
  sku: string
): Promise<ProductResponse> {
  const { data } = await client.get<ProductResponse>(
    `${basePath}/products/by-sku/${encodeURIComponent(sku)}`
  );
  return data;
}

/**
 * Creates a new product (created in Draft status).
 *
 * `POST {basePath}/products`
 */
export async function createProduct(
  client: AxiosInstance,
  basePath: string,
  request: ProductCreateRequest
): Promise<ProductResponse> {
  const { data } = await client.post<ProductResponse>(`${basePath}/products`, request);
  return data;
}

/**
 * Updates the editable fields of a Draft product.
 *
 * `PUT {basePath}/products/{id}`
 */
export async function updateProduct(
  client: AxiosInstance,
  basePath: string,
  id: ProductId,
  request: ProductUpdateRequest
): Promise<ProductResponse> {
  const { data } = await client.put<ProductResponse>(
    `${basePath}/products/${encodeURIComponent(id)}`,
    request
  );
  return data;
}

/**
 * Replaces all metadata of a product (any lifecycle status).
 *
 * `PUT {basePath}/products/{id}/metadata`
 */
export async function updateProductMetadata(
  client: AxiosInstance,
  basePath: string,
  id: ProductId,
  request: UpdateProductMetadataRequest
): Promise<ProductResponse> {
  const { data } = await client.put<ProductResponse>(
    `${basePath}/products/${encodeURIComponent(id)}/metadata`,
    request
  );
  return data;
}

/**
 * Transitions a Draft product to Published.
 *
 * `POST {basePath}/products/{id}/publish` — responds `204 No Content`.
 */
export async function publishProduct(
  client: AxiosInstance,
  basePath: string,
  id: ProductId
): Promise<void> {
  await client.post(`${basePath}/products/${encodeURIComponent(id)}/publish`);
}

/**
 * Archives a Published product.
 *
 * `POST {basePath}/products/{id}/archive` — responds `204 No Content`.
 */
export async function archiveProduct(
  client: AxiosInstance,
  basePath: string,
  id: ProductId
): Promise<void> {
  await client.post(`${basePath}/products/${encodeURIComponent(id)}/archive`);
}

/**
 * Adds an external provider mapping (Stripe, Avalara, Odoo, ...) to a product.
 *
 * `POST {basePath}/products/{id}/external-mappings` — responds `200 OK` with the
 * full updated product (including the new mapping in `externalMappings`).
 */
export async function addProductExternalMapping(
  client: AxiosInstance,
  basePath: string,
  id: ProductId,
  request: AddProductExternalMappingRequest
): Promise<ProductResponse> {
  const { data } = await client.post<ProductResponse>(
    `${basePath}/products/${encodeURIComponent(id)}/external-mappings`,
    request
  );
  return data;
}

/**
 * Removes an external provider mapping from a product.
 *
 * `DELETE {basePath}/products/{id}/external-mappings/{mappingId}`
 */
export async function removeProductExternalMapping(
  client: AxiosInstance,
  basePath: string,
  id: ProductId,
  mappingId: ProductExternalMappingId
): Promise<void> {
  await client.delete(
    `${basePath}/products/${encodeURIComponent(id)}/external-mappings/${encodeURIComponent(mappingId)}`
  );
}
