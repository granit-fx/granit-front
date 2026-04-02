// ---------------------------------------------------------------------------
// @granit/templating — public API (pure TypeScript, no React)
// ---------------------------------------------------------------------------

// Types
export { DocumentFormat, TemplateLifecycleStatus } from './types/index.js';

export type {
  DocumentFormatValue,
  SaveTemplateCategoryRequest,
  SaveTemplateRequest,
  TemplateCategory,
  TemplateDetail,
  TemplateHistory,
  TemplateKey,
  TemplateLifecycle,
  TemplateLifecycleStatusValue,
  TemplateListItem,
  TemplateListParams,
  TemplateParseError,
  TemplatePreviewRequest,
  TemplatePreviewResponse,
  TemplateRevision,
  TemplateRevisionSummary,
  TemplateVariable,
  TemplateVariables,
  TemplatingConfig,
} from './types/index.js';

// Query keys (for advanced usage / custom queries)
export { templateKeys } from './hooks/query-keys.js';

// API
export {
  createCategory,
  deleteCategory,
  deleteDraft,
  getCategories,
  getHistory,
  getLayouts,
  getLifecycleInfo,
  getRevision,
  getTemplate,
  getTemplates,
  getVariables,
  previewTemplate,
  previewTemplateBinary,
  publishTemplate,
  saveDraft,
  unpublishTemplate,
  updateCategory,
  updateDraft,
} from './api/templates-api.js';
