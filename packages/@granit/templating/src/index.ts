// ---------------------------------------------------------------------------
// @granit/templating — public API (pure TypeScript, no React)
// ---------------------------------------------------------------------------

// Types
export { DocumentFormat, TemplateLifecycleStatus } from './types/index';

export type {
  DocumentFormatValue,
  SaveTemplateCategoryRequest,
  SaveTemplateRequest,
  TemplateCategory,
  TemplateCategoryId,
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
  TemplateRevisionId,
  TemplateRevisionSummary,
  TemplateVariable,
  TemplateVariables,
  TemplatingConfig,
} from './types/index';

// Query keys (for advanced usage / custom queries)

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
} from './api/templates-api';
export { TemplatingPermissions } from './permissions';
