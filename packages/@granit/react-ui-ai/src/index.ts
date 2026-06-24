// Pages
export { AIWorkspaceListPage } from './components/ai-workspace-list-page';
export { AIWorkspaceCreatePage } from './components/ai-workspace-create-page';
export { AIWorkspaceEditPage } from './components/ai-workspace-edit-page';
export { AIUsagePage } from './components/ai-usage-page';

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
  createWorkspaceResolver,
  type CreateWorkspaceFormValues,
  type EditWorkspaceFormValues,
  type WorkspaceFormValues,
} from './validation';

// i18n
export { aiTranslationsEn, aiTranslationsFr } from './locales';
