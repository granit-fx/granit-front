import { createContext, useContext, type ReactNode } from 'react';

import { osmProvider } from '../providers/osm-provider';

import type { MapTileProvider } from '../types/index';

const MapTileProviderContext = createContext<MapTileProvider>(osmProvider);

export interface MapTileProviderProviderProps {
  /**
   * Provider mounted on every {@link MapSnapshotWidget} below the provider.
   * Defaults to {@link osmProvider} when no context is supplied — apps
   * never crash on a missing provider, they just render OSM tiles.
   */
  readonly provider: MapTileProvider;
  readonly children: ReactNode;
}

/**
 * Supplies the active {@link MapTileProvider} to the dashboard subtree.
 *
 * Apps configure this once at the root — typically:
 *
 *     // Belgian public-sector deployment
 *     <MapTileProviderProvider provider={spwProvider}>
 *       <SnapshotWidgetRegistryProvider registries={[
 *         defaultSnapshotWidgetRegistry,
 *         defaultAnalyticsSnapshotWidgetRegistry,
 *         defaultMapSnapshotWidgetRegistry,
 *       ]}>
 *         <RenderedDashboard dashboardId={id} />
 *       </SnapshotWidgetRegistryProvider>
 *     </MapTileProviderProvider>
 *
 * Per-widget tile-URL overrides via `MapWidgetSnapshot.tileUrlTemplate`
 * still take precedence (escape hatch for one-off widgets).
 */
export function MapTileProviderProvider({ provider, children }: MapTileProviderProviderProps) {
  return (
    <MapTileProviderContext.Provider value={provider}>{children}</MapTileProviderContext.Provider>
  );
}

/**
 * Reads the active {@link MapTileProvider}. Falls back to {@link osmProvider}
 * when no provider context is mounted — `<MapSnapshotWidget>` never throws on
 * a missing provider, it just degrades to the public OSM tiles (with the
 * mandatory CC-BY-SA attribution surfaced in the widget chrome).
 */
export function useMapTileProvider(): MapTileProvider {
  return useContext(MapTileProviderContext);
}
