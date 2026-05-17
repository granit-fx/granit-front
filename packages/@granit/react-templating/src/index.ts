// ---------------------------------------------------------------------------
// @granit/react-templating — public API
// ---------------------------------------------------------------------------

// Provider
export { TemplatingProvider, useTemplatingConfig } from './providers/templating-provider.js';
export type { TemplatingConfig, TemplatingProviderProps } from './providers/templating-provider.js';

// Hooks
export { useTemplate } from './hooks/use-template.js';
export { useTemplateLayouts } from './hooks/use-template-layouts.js';
export {
  useTemplateCategories,
  useTemplateCategoryMutations,
} from './hooks/use-template-categories.js';
export { useTemplateHistory, useTemplateRevision } from './hooks/use-template-history.js';
export { useTemplateMutations } from './hooks/use-template-mutations.js';
export { useTemplateBinaryPreview, useTemplatePreview } from './hooks/use-template-preview.js';
export { useTemplateVariables } from './hooks/use-template-variables.js';
export { useTemplates } from './hooks/use-templates.js';

// Query keys
export { templateKeys } from './hooks/query-keys.js';
