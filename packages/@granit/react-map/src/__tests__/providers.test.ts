import { describe, expect, it } from 'vitest';

import { arcGisProvider } from '../providers/arcgis-provider.js';
import { osmProvider } from '../providers/osm-provider.js';
import { spwProvider } from '../providers/spw-provider.js';

describe('built-in tile providers', () => {
  it('osmProvider exposes a single plan layer with mandatory CC-BY-SA attribution', () => {
    expect(osmProvider.id).toBe('osm');
    expect(osmProvider.layers).toHaveLength(1);
    expect(osmProvider.layers[0].kind).toBe('plan');
    expect(osmProvider.layers[0].url).toContain('tile.openstreetmap.org');
    expect(osmProvider.layers[0].attribution).toContain('OpenStreetMap');
  });

  it('spwProvider ships plan / satellite / hybrid layers with SPW attribution', () => {
    expect(spwProvider.id).toBe('spw');
    expect(spwProvider.layers.map((l) => l.kind)).toEqual(['plan', 'satellite', 'hybrid']);
    for (const layer of spwProvider.layers) {
      expect(layer.attribution).toContain('Service Public de Wallonie');
      expect(layer.url).toContain('geoservices.wallonie.be');
    }
  });

  it('arcGisProvider ships plan / satellite / topo Esri basemaps', () => {
    expect(arcGisProvider.id).toBe('arcgis');
    expect(arcGisProvider.layers.map((l) => l.kind)).toEqual(['plan', 'satellite', 'topo']);
    for (const layer of arcGisProvider.layers) {
      expect(layer.attribution).toContain('Esri');
      expect(layer.url).toContain('arcgisonline.com');
    }
  });

  it('all built-in providers default to a non-empty layer set (TS tuple constraint)', () => {
    for (const provider of [osmProvider, spwProvider, arcGisProvider]) {
      expect(provider.layers.length).toBeGreaterThan(0);
      const first = provider.layers[0];
      expect(first.id).toBeTruthy();
      expect(first.url).toBeTruthy();
    }
  });
});
