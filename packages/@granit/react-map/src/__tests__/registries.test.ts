import { describe, expect, it } from 'vitest';

import { MapTile } from '../components/map-tile.js';
import { mapWidgetConfigFormRegistry } from '../editor/index.js';
import { defaultMapWidgetRegistry } from '../registry/default-map-widget-registry.js';
import { defaultMapSnapshotWidgetRegistry } from '../snapshot/default-map-snapshot-widget-registry.js';
import { MapSnapshotWidget } from '../snapshot/map-snapshot-widget.js';

describe('defaultMapWidgetRegistry', () => {
  it('registers MapTile under the "map" key', () => {
    expect(defaultMapWidgetRegistry.map).toBe(MapTile);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(defaultMapWidgetRegistry)).toBe(true);
  });
});

describe('defaultMapSnapshotWidgetRegistry', () => {
  it('registers MapSnapshotWidget under the "Map" key', () => {
    expect(defaultMapSnapshotWidgetRegistry.Map).toBe(MapSnapshotWidget);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(defaultMapSnapshotWidgetRegistry)).toBe(true);
  });
});

describe('mapWidgetConfigFormRegistry', () => {
  it('registers a MapConfigForm under the "map" key', () => {
    expect(mapWidgetConfigFormRegistry.map).toBeTypeOf('function');
  });

  it('is frozen', () => {
    expect(Object.isFrozen(mapWidgetConfigFormRegistry)).toBe(true);
  });
});
