import { createContext, useContext, useMemo, type ReactNode } from 'react';

import {
  composeSnapshotRegistries,
  type SnapshotWidgetRegistry,
} from './snapshot-widget-registry.js';

const SnapshotWidgetRegistryContext = createContext<SnapshotWidgetRegistry | null>(null);

export interface SnapshotWidgetRegistryProviderProps {
  /** Registries are merged left-to-right; later entries win for the same `widgetType`. */
  readonly registries: readonly SnapshotWidgetRegistry[];
  readonly children: ReactNode;
}

/**
 * Supplies the active {@link SnapshotWidgetRegistry} to the
 * {@link RenderedDashboard} subtree.
 *
 * Place this near the app root, composing the registries you need — typically:
 *   `[defaultSnapshotWidgetRegistry, defaultAnalyticsSnapshotWidgetRegistry, appCustomRegistry]`.
 *
 * The provider memoises the composed registry so children only re-render when
 * the actual set of renderers changes.
 */
export function SnapshotWidgetRegistryProvider({
  registries,
  children,
}: SnapshotWidgetRegistryProviderProps) {
  const registry = useMemo(() => composeSnapshotRegistries(...registries), [registries]);
  return (
    <SnapshotWidgetRegistryContext.Provider value={registry}>
      {children}
    </SnapshotWidgetRegistryContext.Provider>
  );
}

/**
 * Reads the active {@link SnapshotWidgetRegistry}. Throws when used outside a
 * {@link SnapshotWidgetRegistryProvider} — the dashboard renderer cannot
 * dispatch widget snapshots without a registry, so failing fast is
 * preferable to silently rendering JSON pretty-prints.
 */
export function useSnapshotWidgetRegistry(): SnapshotWidgetRegistry {
  const registry = useContext(SnapshotWidgetRegistryContext);
  if (registry === null) {
    throw new Error(
      'useSnapshotWidgetRegistry must be used inside a <SnapshotWidgetRegistryProvider>. ' +
        'Wrap your <RenderedDashboard> tree at the app root with the framework defaults plus any extension registries.'
    );
  }
  return registry;
}
