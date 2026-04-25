// Types
export type {
  AddProductExternalMappingRequest,
  Product,
  ProductCreateRequest,
  ProductExternalMappingId,
  ProductExternalMappingResponse,
  ProductId,
  ProductLifecycleStatus,
  ProductListParams,
  ProductPage,
  ProductResponse,
  ProductType,
  ProductUpdateRequest,
  UpdateProductMetadataRequest,
} from './types.js';

// Permissions
export { CatalogPermissions } from './permissions.js';

// API
export {
  addProductExternalMapping,
  archiveProduct,
  createProduct,
  createProductsSavedView,
  deleteProductsSavedView,
  getProductById,
  getProductBySku,
  getProductsQueryMeta,
  listProducts,
  listProductsSavedViews,
  listPublishedProducts,
  publishProduct,
  removeProductExternalMapping,
  setDefaultProductsSavedView,
  updateProduct,
  updateProductMetadata,
  updateProductsSavedView,
} from './api/catalog-api.js';
