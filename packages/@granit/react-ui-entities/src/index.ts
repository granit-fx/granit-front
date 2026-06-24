// Workspace entity pages
export { WorkspaceEntityPage } from './workspace-entity-page';
export {
  WorkspaceEntityDetailPage,
} from './workspace-entity-detail-page';
export {
  WorkspaceEntityFormPage,
  type WorkspaceEntityFormPageProps,
} from './workspace-entity-form-page';

// Views
export { EntityCalendarView, type EntityCalendarViewProps, type CalendarViewMode } from './entity-calendar-view';
export { EntityKanbanView, type EntityKanbanViewProps } from './entity-kanban-view';
export { EntityGalleryView, type EntityGalleryViewProps, type GalleryRenderImage } from './entity-gallery-view';
export { EntityViewSwitcher, type EntityViewSwitcherProps } from './entity-view-switcher';
export { EntityDetailContent, type EntityDetailContentProps } from './entity-detail-content';
export { CollectionSectionCard } from './collection-section-card';

// Action overlays + scope
export { ActionDrawer } from './action-drawer';
export { ActionModal } from './action-modal';
export { EntityActionButton, type EntityActionButtonProps } from './entity-action-button';
export { EntityActionScopeProvider, useEntityActionScope } from './entity-action-scope';

// Layout + side peek
export { EntityPageLayout, type EntityPageLayoutProps, type EntityPageLayoutWidth } from './entity-page-layout';
export { SidePeekDrawer, type SidePeekDrawerProps } from './side-peek-drawer';

// Form-component catalog
export {
  PhoneFormComponent,
  UrlFormComponent,
  TimezoneFormComponent,
  EmailFormComponent,
  MoneyFormComponent,
  GRANIT_UI_FORM_COMPONENTS,
} from './form-catalog';

// Helpers + manifest extensions
export { recapParentRefs, type ParentRef } from './bulk-recap';
export {
  asExtended,
  type ExtendedEntityManifest,
  type ExtendedIdentitySection,
  type EntityCollectionSectionManifest,
  type CollectionColumnManifest,
} from './manifest-extensions';
