// Pages
export { AIWorkspaceListPage } from './ai-workspace-list-page';
export { AIWorkspaceCreatePage } from './ai-workspace-create-page';
export { AIWorkspaceEditPage } from './ai-workspace-edit-page';
export { AIUsagePage } from './ai-usage-page';

// Components
export { createWorkspaceColumns } from './components/workspace-columns';
export { WorkspaceTable } from './components/workspace-table';
export { WorkspaceForm } from './components/workspace-form';
export { WorkspaceDetail } from './components/workspace-detail';
export { WorkspaceCapabilities } from './components/workspace-capabilities';
export { WorkspaceDeleteDialog } from './components/workspace-delete-dialog';
export { WorkspaceTestPanel } from './components/workspace-test-panel';

// Validation
export {
  createWorkspaceSchema,
  editWorkspaceSchema,
  type CreateWorkspaceFormValues,
  type EditWorkspaceFormValues,
} from './validation';

// i18n
export { aiTranslationsEn, aiTranslationsFr } from './locales';
