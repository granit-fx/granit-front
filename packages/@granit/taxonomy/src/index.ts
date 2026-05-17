// Types
export type {
  CategoryAssignmentRequest,
  CategoryAssignmentResponse,
  CategoryDetailResponse,
  CategoryListFilter,
  CategoryResponse,
  CreateCategoryRequest,
  CreateTagRequest,
  HexColor,
  MoveCategoryRequest,
  TagAssignmentRequest,
  TagAssignmentResponse,
  TagListFilter,
  TagResponse,
  TaxonomySearchFilter,
  TaxonomySearchResultGroup,
  TaxonomySearchResultItem,
  TaxonomyTargetRef,
  UpdateCategoryRequest,
  UpdateTagRequest,
} from './types/index.js';

// Type guards
export { isHexColor } from './types/index.js';

// Permissions
export { TaxonomyPermissions } from './permissions.js';

// API — Tags
export {
  assignTag,
  createTag,
  deleteTag,
  getTagAssignments,
  listTags,
  unassignTag,
  updateTag,
} from './api/tags-api.js';

// API — Categories
export {
  assignCategory,
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  moveCategory,
  unassignCategory,
  updateCategory,
} from './api/categories-api.js';

// API — Search
export { searchTaxonomy } from './api/search-api.js';

// API — Documents proxy (use only on the Documents surface)
export {
  attachTagToDocument,
  detachTagFromDocument,
  listDocumentTags,
} from './api/documents-proxy-api.js';
