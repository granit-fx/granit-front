// ---------------------------------------------------------------------------
// @granit/react-ui-templating — public API
// ---------------------------------------------------------------------------

// Pages
export { TemplateCreatePage } from './components/template-create-page';
export { TemplateEditPage } from './components/template-edit-page';
export { TemplateListPage } from './components/template-list-page';

// Components
export { TemplateCategoriesDialog } from './components/template-categories-dialog';
export { TemplateDashboard } from './components/template-dashboard';
export { TemplateEditor } from './components/template-editor';
export type { TemplateEditorHandle } from './components/template-editor';
export { TemplateForm } from './components/template-form';
export { TemplateHistory } from './components/template-history';
export { TemplateLifecycleActions } from './components/template-lifecycle-actions';
export { TemplatePreview } from './components/template-preview';
export { TemplateRevisionDiff } from './components/template-revision-diff';
export { TemplateStatusBadge } from './components/template-status-badge';
export { VariablePanel } from './components/variable-panel';
export { createTemplateColumns } from './components/template-columns';

// Hooks
export { useTestDataStore } from './hooks/use-test-data-store';

// Form values
export type { TemplateFormValues } from './validation';

// Constants
export { DEFAULT_PAGE_SIZE, QUERY_CONFIG, TEMPLATING_CONFIG } from './constants';

// i18n bundles
export { templatesTranslationsEn, templatesTranslationsFr } from './locales';
