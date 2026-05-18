// ---------------------------------------------------------------------------
// @granit/react-catalog — public API
// ---------------------------------------------------------------------------

// Provider
export {
  CatalogProvider,
  buildCatalogQueryKey,
  useCatalogConfig,
} from './providers/catalog-provider.js';
export type {
  CatalogConfig,
  CatalogProviderProps,
  ResolvedCatalogConfig,
} from './providers/catalog-provider.js';

// Hooks
export {
  useAddProductExternalMapping,
  useArchiveProduct,
  useCreateProduct,
  useProduct,
  useProductBySku,
  usePublishProduct,
  usePublishedProducts,
  useRemoveProductExternalMapping,
  useUpdateProduct,
  useUpdateProductMetadata,
} from './hooks/use-products.js';
export type {
  AddProductExternalMappingVariables,
  RemoveProductExternalMappingVariables,
  UpdateProductMetadataVariables,
  UpdateProductVariables,
} from './hooks/use-products.js';
