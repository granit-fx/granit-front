// Provider
export {
  CustomizationProvider,
  buildCustomizationQueryKey,
  useCustomizationConfig,
} from './providers/customization-provider.js';
export type {
  CustomizationConfig,
  CustomizationProviderProps,
  ResolvedCustomizationConfig,
} from './providers/customization-provider.js';

// Constants
export { API_VERSION, DEFAULT_API_BASE, DEFAULT_QUERY_KEY_PREFIX } from './constants.js';

// Hooks
export { useFormCustomization, usePutFormCustomization } from './hooks/use-form-customization.js';
export {
  usePutWorkspaceCustomization,
  useWorkspaceCustomization,
} from './hooks/use-workspace-customization.js';

// Layout helpers (pure)
export {
  applyDeltas,
  moveFieldDown,
  moveFieldUp,
  setFieldGroup,
  toggleFieldHidden,
} from './layout/apply-deltas.js';
export type { EffectiveField, SchemaField } from './layout/apply-deltas.js';

// Components
export { FormLayoutEditor } from './components/form-layout-editor.js';
export type { FormLayoutEditorProps, LayoutEditorLabels } from './components/form-layout-editor.js';
export { WorkspaceLayoutEditor } from './components/workspace-layout-editor.js';
export type { WorkspaceLayoutEditorProps } from './components/workspace-layout-editor.js';
export { FieldInspectorOverlay, RESOLUTION_LAYERS } from './components/field-inspector-overlay.js';
export type {
  FieldInspectorOverlayLabels,
  FieldInspectorOverlayProps,
  FieldResolutionEntry,
  ResolutionLayer,
} from './components/field-inspector-overlay.js';

// i18n resource bundles (namespace: 'customization')
export { customizationTranslationsEn, customizationTranslationsFr } from './locales/index.js';
export type { CustomizationTranslations } from './locales/index.js';
