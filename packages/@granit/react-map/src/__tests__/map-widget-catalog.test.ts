import { describe, expect, it } from 'vitest';

import { mapWidgetCatalog } from '../editor/map-widget-catalog.js';

describe('mapWidgetCatalog', () => {
  it('ships a single entry for the `map` kind', () => {
    expect(mapWidgetCatalog.map((entry) => entry.type)).toEqual(['map']);
  });

  it('factory returns a widget bound to a lat-lng point source by default', () => {
    const entry = mapWidgetCatalog[0];
    if (!entry) throw new Error('catalog empty');
    const widget = entry.createDefaultWidget('M', 0) as {
      type: string;
      pointSource: { kind: string };
      clusterThreshold: number;
    };
    expect(widget.type).toBe('map');
    expect(widget.pointSource.kind).toBe('lat-lng');
    expect(widget.clusterThreshold).toBe(200);
  });

  it('factory leaves queryName / lat / lng columns empty for the user to fill in', () => {
    const entry = mapWidgetCatalog[0];
    if (!entry) throw new Error('catalog empty');
    const widget = entry.createDefaultWidget('M', 0) as {
      queryName: string;
      pointSource: { latitudeColumn: string; longitudeColumn: string };
    };
    expect(widget.queryName).toBe('');
    expect(widget.pointSource.latitudeColumn).toBe('');
    expect(widget.pointSource.longitudeColumn).toBe('');
  });

  it('default size matches the framework MEDIA_TILE proportions on a 12-column grid', () => {
    const entry = mapWidgetCatalog[0];
    if (!entry) throw new Error('catalog empty');
    expect(entry.defaultSize).toEqual({ width: 6, height: 4 });
  });
});
