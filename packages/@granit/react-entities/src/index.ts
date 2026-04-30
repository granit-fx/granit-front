// ---------------------------------------------------------------------------
// @granit/react-entities — public API
// ---------------------------------------------------------------------------
//
// React hooks + generic renderers driven by the manifest exposed by
// @granit/entities. Implementation tracked under
// granit-fx/granit-front#298 (hooks) and #299 (renderers).

export { EntityDetail } from './components/entity-detail.js';
export type { EntityDetailProps } from './components/entity-detail.js';
export { EntityForm } from './components/entity-form.js';
export type { EntityFormProps } from './components/entity-form.js';
export { EntityList } from './components/entity-list.js';
export type { EntityListProps } from './components/entity-list.js';
export { STANDARD_FORM_WIDGETS } from './widgets/index.js';
export type { SelectWidgetOption } from './widgets/index.js';
export { entityDiscoveryQueryKey, useEntityDiscovery } from './api/use-entity-discovery.js';
export { entityManifestQueryKey, useEntityMetadata } from './api/use-entity-metadata.js';
export {
  EMPTY_WIDGET_CATALOG,
  EntityRendererProvider,
  useEntityRenderer,
} from './provider/index.js';
export type {
  EntityFormWidget,
  EntityFormWidgetProps,
  EntityRendererContextValue,
  EntityRendererProviderProps,
  EntitySidePanel,
  EntitySidePanelProps,
  EntityWidgetCatalog,
  ResolveLabel,
} from './provider/index.js';
