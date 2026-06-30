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
  SearchHit,
  SearchResponse,
  SearchTagItem,
  TagAssignmentRequest,
  TagAssignmentResponse,
  TagListFilter,
  TagResponse,
  TaxonomySearchFilter,
  TaxonomySearchResult,
  TaxonomySearchResultGroup,
  TaxonomySearchResultItem,
  TaxonomyTargetRef,
  UpdateCategoryRequest,
  UpdateTagRequest,
} from './types/index';

// Type guards
export { isHexColor } from './types/index';

// Permissions
export { TaxonomyPermissions } from './permissions';

// Validation constraints (generated from contracts/openapi/taxonomy.json)
export { taxonomyConstraints } from './constraints';

// API — Tags
export {
  assignTag,
  createTag,
  deleteTag,
  getTag,
  listAssignedTags,
  listTags,
  unassignTag,
  updateTag,
} from './api/tags-api';

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
} from './api/categories-api';

// API — Search
export { searchTaxonomy } from './api/search-api';

// API — Documents proxy (use only on the Documents surface)
export {
  attachTagToDocument,
  detachTagFromDocument,
  listDocumentTags,
} from './api/documents-proxy-api';
