import { MapTile } from '../components/map-tile.js';

import type { WidgetRegistry, WidgetRendererFn } from '@granit/react-dashboards';

/**
 * Map widget renderer (definition path), keyed by the `'map'` `type`
 * discriminator. Compose with the framework default + analytics
 * registries at the app root:
 *
 *     <WidgetRegistryProvider
 *       registries={[
 *         defaultWidgetRegistry,
 *         defaultAnalyticsWidgetRegistry,
 *         defaultMapWidgetRegistry,
 *       ]}
 *     >...</WidgetRegistryProvider>
 *
 * Definition-path renderer — fetches via `POST /widgets/map/render`
 * (backend P3) through {@link useWidgetRender}, then dispatches
 * through `<RenderedWidget>` for chrome / action symmetry with the
 * bundle path's `<MapSnapshotWidget>`.
 */
export const defaultMapWidgetRegistry: WidgetRegistry = Object.freeze({
  // The cast routes through `unknown` because TypeScript can't relate
  // `MapTile`'s narrow `MapWidgetDefinition` prop to the registry's
  // open `WidgetDefinition` type — same pattern as the analytics
  // registries.
  map: MapTile as unknown as WidgetRendererFn,
});
