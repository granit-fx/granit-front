import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { composeRegistries, type WidgetRegistry } from './widget-registry';

const WidgetRegistryContext = createContext<WidgetRegistry | null>(null);

export interface WidgetRegistryProviderProps {
  /** Registries are merged left-to-right; later entries win for the same type. */
  readonly registries: readonly WidgetRegistry[];
  readonly children: ReactNode;
}

/**
 * Supplies the active {@link WidgetRegistry} to the dashboard renderer subtree.
 *
 * Place this near the app root, composing the registries you need — typically:
 *   `[defaultWidgetRegistry, analyticsWidgetRegistry, appCustomRegistry]`.
 *
 * The provider memoises the composed registry so children only re-render when
 * the actual set of renderers changes.
 */
export function WidgetRegistryProvider({ registries, children }: WidgetRegistryProviderProps) {
  const registry = useMemo(() => composeRegistries(...registries), [registries]);
  return (
    <WidgetRegistryContext.Provider value={registry}>{children}</WidgetRegistryContext.Provider>
  );
}

/**
 * Reads the active {@link WidgetRegistry}. Throws when used outside a
 * {@link WidgetRegistryProvider} — the dashboard renderer cannot dispatch
 * widget types without a registry, so failing fast is preferable to rendering
 * placeholders that silently lose data.
 */
export function useWidgetRegistry(): WidgetRegistry {
  const registry = useContext(WidgetRegistryContext);
  if (registry === null) {
    throw new Error(
      'useWidgetRegistry must be used inside a <WidgetRegistryProvider>. ' +
        'Wrap your dashboard tree at the app root with the framework defaults plus any extension registries.'
    );
  }
  return registry;
}
