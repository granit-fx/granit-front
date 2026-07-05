// @granit/react-ui-blog — admin UI for the Blog module.
// Composes the headless @granit/react-blog (BlogProvider + hooks) with the
// foundation UI packages. The host app supplies BlogProvider, CmsProvider (for
// the block catalog), DocumentsProvider (media pickers) and AuthorizationProvider
// (permission gating); these pages only call the hooks. Form validation derives
// from the @granit/blog blogConstraints via createConstraintsResolver.

// Posts
export { PostsListPage } from './components/posts-list-page';
export type { PostsListPageProps } from './components/posts-list-page';
export { createPostsColumns } from './components/posts-columns';
export { PostEditorPage } from './components/post-editor-page';
export type { PostEditorPageProps } from './components/post-editor-page';
export { PostMetadataForm } from './components/post-metadata-form';
export type { PostMetadataFormProps } from './components/post-metadata-form';
export { PostContentEditor } from './components/post-content-editor';
export type { PostContentEditorProps } from './components/post-content-editor';
export { PostGalleryEditor } from './components/post-gallery-editor';
export type { PostGalleryEditorProps } from './components/post-gallery-editor';
export { PostLifecyclePanel } from './components/post-lifecycle-panel';
export type { PostLifecyclePanelProps } from './components/post-lifecycle-panel';
export { PostConflictDialog } from './components/post-conflict-dialog';
export type { PostConflictDialogProps } from './components/post-conflict-dialog';

// Authors
export { AuthorsListPage } from './components/authors-list-page';
export type { AuthorsListPageProps } from './components/authors-list-page';
export { AuthorFormPage } from './components/author-form-page';
export type { AuthorFormPageProps } from './components/author-form-page';

// Shared
export { DocumentPickerButton } from './components/document-picker-button';
export type { DocumentPickerButtonProps } from './components/document-picker-button';

// i18next resource bundles (flat keys, "translation" ns). Owns the blog:Common.*
// keys as the Blog module root, alongside the blog:Posts.* / blog:Authors.* keys.
export { blogTranslationsEn, blogTranslationsFr } from './locales/index';
export type { BlogTranslations } from './locales/index';
