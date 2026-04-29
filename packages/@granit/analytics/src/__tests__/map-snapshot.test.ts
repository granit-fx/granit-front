import { describe, expect, it } from 'vitest';

import {
  isGeographyMapPointSource,
  isLatLngMapPointSource,
  isMapSnapshotEnvelope,
} from '../widgets/index.js';

import type { MapPointSource, MapSnapshotEnvelope } from '../widgets/index.js';
import type { WidgetSnapshotEnvelope } from '@granit/dashboards';

// Pinned wire-format fixtures mirroring B7-2 backend output:
//   - Granit.Analytics.Endpoints.Rendering.MapWidgetInstanceRenderer
// camelCase property names + PascalCase enum values per ADR-039 §6.1.

const MAP_FIXTURE: MapSnapshotEnvelope = {
  status: 'Snapshot',
  widgetType: 'Map',
  snapshot: {
    points: [
      {
        id: '8c6b1e10-0000-0000-0000-00000000aaaa',
        latitude: 48.8566,
        longitude: 2.3522,
        popup: { name: 'Paris HQ', employees: 142 },
      },
      {
        id: '8c6b1e10-0000-0000-0000-00000000bbbb',
        latitude: 50.8503,
        longitude: 4.3517,
        popup: { name: 'Brussels Office', employees: 38 },
      },
      {
        id: null,
        latitude: 40.4168,
        longitude: -3.7038,
        popup: null,
      },
    ],
    defaultZoom: 5,
    defaultCenter: { latitude: 48.8566, longitude: 2.3522 },
    clusterThreshold: 200,
    detailRoute: '/customers/{id}',
    tileUrlTemplate: null,
  },
  sequence: 1,
  emittedAt: '2026-04-29T12:34:56.789Z',
  refreshHint: 'Dynamic',
  reasonLocalizationKey: null,
};

describe('MapSnapshotEnvelope — wire format', () => {
  it('carries points + camera + clustering + detail-route hints', () => {
    expect(MAP_FIXTURE.snapshot?.points).toHaveLength(3);
    expect(MAP_FIXTURE.snapshot?.defaultZoom).toBe(5);
    expect(MAP_FIXTURE.snapshot?.defaultCenter?.latitude).toBe(48.8566);
    expect(MAP_FIXTURE.snapshot?.detailRoute).toBe('/customers/{id}');
  });

  it('accepts null id (entity has no Guid Id) and null popup (no whitelisted columns)', () => {
    const last = MAP_FIXTURE.snapshot?.points[2];
    expect(last?.id).toBeNull();
    expect(last?.popup).toBeNull();
  });

  it('round-trips through JSON without mutation', () => {
    expect(JSON.parse(JSON.stringify(MAP_FIXTURE))).toEqual(MAP_FIXTURE);
  });
});

describe('isMapSnapshotEnvelope — type guard', () => {
  it('narrows when widgetType is the Map discriminator', () => {
    const generic: WidgetSnapshotEnvelope = MAP_FIXTURE;
    expect(isMapSnapshotEnvelope(generic)).toBe(true);
  });

  it('rejects envelopes carrying a different widgetType', () => {
    const otherKind: WidgetSnapshotEnvelope = { ...MAP_FIXTURE, widgetType: 'Chart' };
    expect(isMapSnapshotEnvelope(otherKind)).toBe(false);
  });
});

describe('MapPointSource — discriminator dispatch', () => {
  const latLng: MapPointSource = {
    kind: 'lat-lng',
    latitudeColumn: 'Latitude',
    longitudeColumn: 'Longitude',
  };
  const geography: MapPointSource = {
    kind: 'geography',
    geographyColumn: 'Location',
  };

  it('routes lat-lng through isLatLngMapPointSource', () => {
    expect(isLatLngMapPointSource(latLng)).toBe(true);
    expect(isLatLngMapPointSource(geography)).toBe(false);
  });

  it('routes geography through isGeographyMapPointSource', () => {
    expect(isGeographyMapPointSource(geography)).toBe(true);
    expect(isGeographyMapPointSource(latLng)).toBe(false);
  });
});
