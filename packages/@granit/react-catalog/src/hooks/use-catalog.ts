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
  ProductExternalMappingResponse,
  ProductResponse,
  ProductUpdateRequest,
  UpdateProductMetadataRequest,
} from '@granit/catalog';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * List all published products available for purchase.
 *
 * @example
 * ```tsx
 * const { data: products } = usePublishedProducts();
 * ```
 */
export function usePublishedProducts(): UseQueryResult<readonly ProductResponse[]> {
  const config = useCatalogConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildCatalogQueryKey(config, 'products'),
    queryFn: () => listPublishedProducts(config.client, basePath),
  });
}

/**
 * Get a product by its identifier (any lifecycle status).
 * Disabled when `id` is empty.
 */
export function useProduct(id: string): UseQueryResult<ProductResponse> {
  const config = useCatalogConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildCatalogQueryKey(config, 'products', id),
    queryFn: () => getProductById(config.client, basePath, id),
    enabled: id.length > 0,
  });
}

/**
 * Get a product by its stable business SKU.
 * Disabled when `sku` is empty.
 */
export function useProductBySku(sku: string): UseQueryResult<ProductResponse> {
  const config = useCatalogConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildCatalogQueryKey(config, 'products', 'by-sku', sku),
    queryFn: () => getProductBySku(config.client, basePath, sku),
    enabled: sku.length > 0,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new product in `Draft` status.
 * Invalidates products queries on success.
 */
export function useCreateProduct(): UseMutationResult<
  ProductResponse,
  Error,
  ProductCreateRequest
> {
  const config = useCatalogConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: (request: ProductCreateRequest) => createProduct(config.client, basePath, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildCatalogQueryKey(config, 'products') });
    },
  });
}

/** Variables for `useUpdateProduct`. */
export type UpdateProductVariables = {
  readonly id: string;
  readonly request: ProductUpdateRequest;
};

/**
 * Update editable fields of a `Draft` product.
 * Invalidates products queries on success.
 */
export function useUpdateProduct(): UseMutationResult<
  ProductResponse,
  Error,
  UpdateProductVariables
> {
  const config = useCatalogConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: ({ id, request }: UpdateProductVariables) =>
      updateProduct(config.client, basePath, id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildCatalogQueryKey(config, 'products') });
    },
  });
}

/** Variables for `useUpdateProductMetadata`. */
export type UpdateProductMetadataVariables = {
  readonly id: string;
  readonly request: UpdateProductMetadataRequest;
};

/**
 * Replace all metadata of a product (any lifecycle status).
 * Invalidates products queries on success.
 */
export function useUpdateProductMetadata(): UseMutationResult<
  ProductResponse,
  Error,
  UpdateProductMetadataVariables
> {
  const config = useCatalogConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: ({ id, request }: UpdateProductMetadataVariables) =>
      updateProductMetadata(config.client, basePath, id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildCatalogQueryKey(config, 'products') });
    },
  });
}

/**
 * Publish a `Draft` product, making it available for purchase.
 * Invalidates products queries on success.
 */
export function usePublishProduct(): UseMutationResult<ProductResponse, Error, string> {
  const config = useCatalogConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: (id: string) => publishProduct(config.client, basePath, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildCatalogQueryKey(config, 'products') });
    },
  });
}

/**
 * Archive a `Published` product. Existing references are preserved for audit.
 * Invalidates products queries on success.
 */
export function useArchiveProduct(): UseMutationResult<ProductResponse, Error, string> {
  const config = useCatalogConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: (id: string) => archiveProduct(config.client, basePath, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildCatalogQueryKey(config, 'products') });
    },
  });
}

/** Variables for `useAddProductExternalMapping`. */
export type AddProductExternalMappingVariables = {
  readonly id: string;
  readonly request: AddProductExternalMappingRequest;
};

/**
 * Add an external provider mapping (Stripe, Avalara, Odoo, …) to a product.
 * Invalidates the targeted product query on success.
 */
export function useAddProductExternalMapping(): UseMutationResult<
  ProductExternalMappingResponse,
  Error,
  AddProductExternalMappingVariables
> {
  const config = useCatalogConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: ({ id, request }: AddProductExternalMappingVariables) =>
      addProductExternalMapping(config.client, basePath, id, request),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: buildCatalogQueryKey(config, 'products', id) });
    },
  });
}

/** Variables for `useRemoveProductExternalMapping`. */
export type RemoveProductExternalMappingVariables = {
  readonly id: string;
  readonly mappingId: string;
};

/**
 * Remove an external provider mapping from a product.
 * Invalidates the targeted product query on success.
 */
export function useRemoveProductExternalMapping(): UseMutationResult<
  void,
  Error,
  RemoveProductExternalMappingVariables
> {
  const config = useCatalogConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: ({ id, mappingId }: RemoveProductExternalMappingVariables) =>
      removeProductExternalMapping(config.client, basePath, id, mappingId),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: buildCatalogQueryKey(config, 'products', id) });
    },
  });
}
