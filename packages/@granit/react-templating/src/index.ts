// ---------------------------------------------------------------------------
// @granit/react-templating — public API
// ---------------------------------------------------------------------------

// Provider
export { TemplatingProvider, useTemplatingConfig } from './providers/templating-provider';
export type { TemplatingConfig, TemplatingProviderProps } from './providers/templating-provider';

// Hooks
export { useTemplate } from './hooks/use-template';
export { useTemplateLayouts } from './hooks/use-template-layouts';
export {
  useTemplateCategories,
  useTemplateCategoryMutations,
} from './hooks/use-template-categories';
export { useTemplateHistory, useTemplateRevision } from './hooks/use-template-history';
export { useTemplateMutations } from './hooks/use-template-mutations';
export { useTemplateBinaryPreview, useTemplatePreview } from './hooks/use-template-preview';
export { useTemplateVariables } from './hooks/use-template-variables';
export { useTemplates } from './hooks/use-templates';

// Query keys
export { templateKeys } from './hooks/query-keys';
