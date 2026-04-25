// Provider
export {
  CatalogProvider,
  buildCatalogQueryKey,
  useCatalogConfig,
} from './providers/catalog-provider.js';
export type { CatalogConfig, CatalogProviderProps } from './providers/catalog-provider.js';

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
} from './hooks/use-catalog.js';
export type {
  AddProductExternalMappingVariables,
  RemoveProductExternalMappingVariables,
  UpdateProductMetadataVariables,
  UpdateProductVariables,
} from './hooks/use-catalog.js';
