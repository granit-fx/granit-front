// ---------------------------------------------------------------------------
// @granit/react-catalog — public API
// ---------------------------------------------------------------------------

// Provider
export {
  CatalogProvider,
  buildCatalogQueryKey,
  useCatalogConfig,
} from './providers/catalog-provider';
export type {
  CatalogConfig,
  CatalogProviderProps,
  ResolvedCatalogConfig,
} from './providers/catalog-provider';

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
} from './hooks/use-products';
export type {
  AddProductExternalMappingVariables,
  RemoveProductExternalMappingVariables,
  UpdateProductMetadataVariables,
  UpdateProductVariables,
} from './hooks/use-products';
