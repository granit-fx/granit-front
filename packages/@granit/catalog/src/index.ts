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
  ProductType,
  ProductUpdateRequest,
  UpdateProductMetadataRequest,
} from './types/index';

export {
  addProductExternalMapping,
  archiveProduct,
  createProduct,
  getProductById,
  getProductBySku,
  listActiveProducts,
  publishProduct,
  removeProductExternalMapping,
  updateProduct,
  updateProductMetadata,
} from './api/products-api';

export { CatalogPermissions } from './permissions';

// Validation constraints (generated from contracts/openapi/catalog.json)
export { catalogConstraints } from './constraints';
