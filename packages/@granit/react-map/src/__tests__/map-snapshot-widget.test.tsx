import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MapTileProviderProvider } from '../components/map-tile-provider-context';
import { spwProvider } from '../providers/spw-provider';
import { MapSnapshotWidget } from '../snapshot/map-snapshot-widget';

import type { MapWidgetSnapshot } from '@granit/analytics';
import type { DashboardRenderedWidget } from '@granit/dashboards';

// Leaflet is heavily DOM-coupled; jsdom doesn't simulate real layout / mouse
// events, so initialising the actual map throws. Stub the surface area we
// touch — the test isolates the widget's *dispatch* logic (envelope status
// short-circuits, data attributes, provider context resolution) from the
// rendering side effects.
vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock('leaflet', () => {
  const noop = () => undefined;
  const tileLayer = vi.fn(() => ({ addTo: vi.fn().mockReturnThis(), remove: vi.fn() }));
  const marker = vi.fn(() => ({
    bindPopup: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    options: {},
    addTo: vi.fn().mockReturnThis(),
  }));
  const layerGroup = vi.fn(() => ({
    addLayer: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  }));
  const map = vi.fn(() => ({
    setView: vi.fn().mockReturnThis(),
    fitBounds: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  }));
  const latLngBounds = vi.fn();
  const controlLayers = vi.fn(() => ({ addTo: vi.fn().mockReturnThis(), remove: vi.fn() }));
  const Icon = { Default: { mergeOptions: noop } };
  const L = {
    map,
    tileLayer,
    marker,
    layerGroup,
    latLngBounds,
    Icon,
    control: { layers: controlLayers },
  };
  return { default: L };
});

const ENVELOPE_BASE = {
  id: '8c6b1e10-0000-0000-0000-000000000001',
  status: 'Snapshot' as const,
  sequence: 1,
  emittedAt: '2026-04-29T12:34:56.789Z',
  refreshHint: 'Dynamic' as const,
  reasonLocalizationKey: null,
};

function mapEnvelope(snapshot: MapWidgetSnapshot): DashboardRenderedWidget {
  return { ...ENVELOPE_BASE, widgetType: 'Map', snapshot };
}

const SAMPLE: MapWidgetSnapshot = {
  points: [
    {
      id: '8c6b1e10-0000-0000-0000-00000000aaaa',
      latitude: 48.8566,
      longitude: 2.3522,
      popup: { name: 'Paris HQ' },
    },
  ],
  defaultZoom: 5,
  defaultCenter: { latitude: 48.8566, longitude: 2.3522 },
  clusterThreshold: 200,
  detailRoute: '/customers/{id}',
  tileUrlTemplate: null,
};

describe('MapSnapshotWidget — dispatcher', () => {
  it('returns null on non-Map envelopes', () => {
    const widget: DashboardRenderedWidget = {
      ...ENVELOPE_BASE,
      widgetType: 'Chart',
      snapshot: { value: 12 },
    };
    const { container } = render(<MapSnapshotWidget widget={widget} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null on Unavailable status', () => {
    const widget: DashboardRenderedWidget = {
      ...ENVELOPE_BASE,
      widgetType: 'Map',
      status: 'Unavailable',
      snapshot: null,
      reasonLocalizationKey: 'Widget:Unavailable',
    };
    const { container } = render(<MapSnapshotWidget widget={widget} />);
    expect(container.firstChild).toBeNull();
  });

  it('mounts the container with the OSM provider id by default', () => {
    const { container } = render(<MapSnapshotWidget widget={mapEnvelope(SAMPLE)} />);
    const slot = container.querySelector('[data-slot="map-snapshot-widget"]');
    expect(slot?.getAttribute('data-tile-provider')).toBe('osm');
  });

  it('reflects the active provider id when wrapped in MapTileProviderProvider', () => {
    const { container } = render(
      <MapTileProviderProvider provider={spwProvider}>
        <MapSnapshotWidget widget={mapEnvelope(SAMPLE)} />
      </MapTileProviderProvider>
    );
    expect(
      container
        .querySelector('[data-slot="map-snapshot-widget"]')
        ?.getAttribute('data-tile-provider')
    ).toBe('spw');
  });

  it('flags the snapshot tileUrlTemplate override on the data attribute', () => {
    const { container } = render(
      <MapSnapshotWidget
        widget={mapEnvelope({
          ...SAMPLE,
          tileUrlTemplate: 'https://tiles.example/{z}/{x}/{y}.png',
        })}
      />
    );
    expect(
      container
        .querySelector('[data-slot="map-snapshot-widget"]')
        ?.getAttribute('data-tile-provider')
    ).toBe('snapshot-override');
  });
});
