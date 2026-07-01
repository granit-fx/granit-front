// ---------------------------------------------------------------------------
// @granit/templating — public API (pure TypeScript, no React)
// ---------------------------------------------------------------------------

// Types
export { TemplateLifecycleStatus } from './types/index';

export type {
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
  WorkflowLifecycleStatus,
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
  getVariables,
  listTemplates,
  previewTemplate,
  previewTemplateBinary,
  publishTemplate,
  saveDraft,
  unpublishTemplate,
  updateCategory,
  updateDraft,
} from './api/templates-api';
export { TemplatingPermissions } from './permissions';

// Validation constraints (generated from contracts/openapi/templating.json)
export { templatingConstraints } from './constraints';
