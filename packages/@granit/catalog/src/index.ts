// ---------------------------------------------------------------------------
// @granit/catalog — public API (pure TypeScript, no React)
// ---------------------------------------------------------------------------
// Mirrors Granit.Catalog .NET (Granit.Catalog.Endpoints).

export type {
  AddProductExternalMappingRequest,
  ProductCreateRequest,
  ProductExternalMappingId,
  ProductExternalMappingResponse,
  ProductId,
  ProductLifecycleStatus,
  ProductResponse,
  ProductUpdateRequest,
  UpdateProductMetadataRequest,
} from './types/index.js';

export {
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
} from './api/products-api.js';

export { CatalogPermissions } from './permissions.js';
