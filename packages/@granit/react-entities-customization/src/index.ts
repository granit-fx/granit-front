// Provider
export {
  CustomizationProvider,
  buildCustomizationQueryKey,
  useCustomizationConfig,
} from './providers/customization-provider';
export type {
  CustomizationConfig,
  CustomizationProviderProps,
  ResolvedCustomizationConfig,
} from './providers/customization-provider';

// Constants
export { API_VERSION, DEFAULT_API_BASE, DEFAULT_QUERY_KEY_PREFIX } from './constants';

// Hooks
export { useEntityCustomization, usePutEntityCustomization } from './hooks/use-form-customization';
export {
  usePutWorkspaceCustomization,
  useWorkspaceCustomization,
} from './hooks/use-workspace-customization';

// Layout helpers (pure)
export {
  applyDeltas,
  moveFieldDown,
  moveFieldUp,
  setFieldGroup,
  toggleFieldHidden,
} from './layout/apply-deltas';
export type { EffectiveField, SchemaField } from './layout/apply-deltas';

// Components
export { FormLayoutEditor } from './components/form-layout-editor';
export type { FormLayoutEditorProps, LayoutEditorLabels } from './components/form-layout-editor';
export { WorkspaceLayoutEditor } from './components/workspace-layout-editor';
export type { WorkspaceLayoutEditorProps } from './components/workspace-layout-editor';
export { FieldInspectorOverlay, RESOLUTION_LAYERS } from './components/field-inspector-overlay';
export type {
  FieldInspectorOverlayLabels,
  FieldInspectorOverlayProps,
  FieldResolutionEntry,
  ResolutionLayer,
} from './components/field-inspector-overlay';

// i18n resource bundles (namespace: 'customization')
export { customizationTranslationsEn, customizationTranslationsFr } from './locales/index';
export type { CustomizationTranslations } from './locales/index';
