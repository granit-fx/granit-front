import {
  addProductExternalMapping,
  archiveProduct,
  createProduct,
  getProductById,
  getProductBySku,
  listPublishedProducts,
  publishProduct,
  removeProductExternalMapping,
  updateProduct,
  updateProductMetadata,
} from '@granit/catalog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildCatalogQueryKey, useCatalogConfig } from '../providers/catalog-provider.js';

import type {
  AddProductExternalMappingRequest,
  ProductCreateRequest,
  ProductExternalMappingId,
  ProductExternalMappingResponse,
  ProductId,
  ProductResponse,
  ProductUpdateRequest,
  UpdateProductMetadataRequest,
} from '@granit/catalog';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Lists all Published products in the catalog. */
export function usePublishedProducts(): UseQueryResult<readonly ProductResponse[]> {
  const config = useCatalogConfig();
  return useQuery({
    queryKey: buildCatalogQueryKey(config, 'products', 'published'),
    queryFn: () => listPublishedProducts(config.client, config.basePath),
  });
}

/** Fetches a product by id (any lifecycle status). */
export function useProduct(id: ProductId | null | undefined): UseQueryResult<ProductResponse> {
  const config = useCatalogConfig();
  return useQuery({
    queryKey: buildCatalogQueryKey(config, 'products', 'detail', id),
    queryFn: () => getProductById(config.client, config.basePath, id as ProductId),
    enabled: Boolean(id),
  });
}

/** Fetches a product by SKU (any lifecycle status). */
export function useProductBySku(sku: string | null | undefined): UseQueryResult<ProductResponse> {
  const config = useCatalogConfig();
  return useQuery({
    queryKey: buildCatalogQueryKey(config, 'products', 'by-sku', sku),
    queryFn: () => getProductBySku(config.client, config.basePath, sku as string),
    enabled: Boolean(sku),
  });
}

// ---------------------------------------------------------------------------
// Mutations — cache invalidation helper
// ---------------------------------------------------------------------------

function useInvalidateProducts() {
  const config = useCatalogConfig();
  const queryClient = useQueryClient();
  return (id?: ProductId) => {
    queryClient.invalidateQueries({ queryKey: buildCatalogQueryKey(config, 'products') });
    if (id) {
      queryClient.invalidateQueries({
        queryKey: buildCatalogQueryKey(config, 'products', 'detail', id),
      });
    }
  };
}

// ---------------------------------------------------------------------------
// Mutations — CRUD
// ---------------------------------------------------------------------------

/** Creates a new product in Draft status. */
export function useCreateProduct(): UseMutationResult<
  ProductResponse,
  Error,
  ProductCreateRequest
> {
  const config = useCatalogConfig();
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (request) => createProduct(config.client, config.basePath, request),
    onSuccess: () => invalidate(),
  });
}

/** Variables for {@link useUpdateProduct}. */
export interface UpdateProductVariables {
  readonly id: ProductId;
  readonly request: ProductUpdateRequest;
}

/** Updates the editable fields of a Draft product. */
export function useUpdateProduct(): UseMutationResult<
  ProductResponse,
  Error,
  UpdateProductVariables
> {
  const config = useCatalogConfig();
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, request }) => updateProduct(config.client, config.basePath, id, request),
    onSuccess: (_data, { id }) => invalidate(id),
  });
}

/** Variables for {@link useUpdateProductMetadata}. */
export interface UpdateProductMetadataVariables {
  readonly id: ProductId;
  readonly request: UpdateProductMetadataRequest;
}

/** Replaces all metadata of a product (any lifecycle status). */
export function useUpdateProductMetadata(): UseMutationResult<
  ProductResponse,
  Error,
  UpdateProductMetadataVariables
> {
  const config = useCatalogConfig();
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, request }) =>
      updateProductMetadata(config.client, config.basePath, id, request),
    onSuccess: (_data, { id }) => invalidate(id),
  });
}

// ---------------------------------------------------------------------------
// Mutations — lifecycle
// ---------------------------------------------------------------------------

/** Transitions a Draft product to Published. */
export function usePublishProduct(): UseMutationResult<ProductResponse, Error, ProductId> {
  const config = useCatalogConfig();
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (id) => publishProduct(config.client, config.basePath, id),
    onSuccess: (_data, id) => invalidate(id),
  });
}

/** Archives a Published product. */
export function useArchiveProduct(): UseMutationResult<ProductResponse, Error, ProductId> {
  const config = useCatalogConfig();
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (id) => archiveProduct(config.client, config.basePath, id),
    onSuccess: (_data, id) => invalidate(id),
  });
}

// ---------------------------------------------------------------------------
// Mutations — external mappings
// ---------------------------------------------------------------------------

/** Variables for {@link useAddProductExternalMapping}. */
export interface AddProductExternalMappingVariables {
  readonly id: ProductId;
  readonly request: AddProductExternalMappingRequest;
}

/** Adds an external provider mapping (Stripe, Avalara, Odoo, ...) to a product. */
export function useAddProductExternalMapping(): UseMutationResult<
  ProductExternalMappingResponse,
  Error,
  AddProductExternalMappingVariables
> {
  const config = useCatalogConfig();
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, request }) =>
      addProductExternalMapping(config.client, config.basePath, id, request),
    onSuccess: (_data, { id }) => invalidate(id),
  });
}

/** Variables for {@link useRemoveProductExternalMapping}. */
export interface RemoveProductExternalMappingVariables {
  readonly id: ProductId;
  readonly mappingId: ProductExternalMappingId;
}

/** Removes an external provider mapping from a product. */
export function useRemoveProductExternalMapping(): UseMutationResult<
  void,
  Error,
  RemoveProductExternalMappingVariables
> {
  const config = useCatalogConfig();
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, mappingId }) =>
      removeProductExternalMapping(config.client, config.basePath, id, mappingId),
    onSuccess: (_data, { id }) => invalidate(id),
  });
}
