import { describe, expect, it } from 'vitest';

import type { WidgetSnapshotEnvelope, WidgetSnapshotStatus } from '../rendering/index';

// Pinned wire-format fixtures for the B3-1 envelope (ADR-039 §6).
// Mirrors what `Granit.Dashboards.Rendering.WidgetSnapshotEnvelope`
// serialises through the framework's host JsonSerializerOptions
// (camelCase property names, PascalCase enum values).

const SNAPSHOT_FIXTURE: WidgetSnapshotEnvelope = {
  status: 'Snapshot',
  widgetType: 'Kpi',
  snapshot: {
    /* Snapshot is `unknown`: typed shape (KpiSnapshot, ChartSnapshot, …)
       lands as B3-2..B3-6 ship. */
    value: 12,
  },
  sequence: 1,
  emittedAt: '2026-04-29T12:34:56.789Z',
  refreshHint: 'Dynamic',
  reasonLocalizationKey: null,
};

const UNAVAILABLE_FIXTURE: WidgetSnapshotEnvelope = {
  status: 'Unavailable',
  widgetType: 'Chart',
  snapshot: null,
  sequence: 1,
  emittedAt: '2026-04-29T12:34:56.789Z',
  refreshHint: 'Dynamic',
  reasonLocalizationKey: 'Widget:Unavailable',
};

const ERROR_FIXTURE: WidgetSnapshotEnvelope = {
  status: 'Error',
  widgetType: 'Pivot',
  snapshot: null,
  sequence: 1,
  emittedAt: '2026-04-29T12:34:56.789Z',
  refreshHint: 'Static',
  // Error envelopes now also carry a localization key (default 'Widget:Error',
  // overridable per call site for renderer-specific causes such as
  // 'Widget:Error.UnknownWidgetType'). The dashboard render endpoint never
  // resolves the key server-side — it stays a wire-level identifier.
  reasonLocalizationKey: 'Widget:Error.UnknownWidgetType',
};

describe('WidgetSnapshotEnvelope — wire format', () => {
  it('accepts the Snapshot variant verbatim', () => {
    expect(SNAPSHOT_FIXTURE.status).toBe('Snapshot');
    expect(SNAPSHOT_FIXTURE.widgetType).toBe('Kpi');
    expect(SNAPSHOT_FIXTURE.snapshot).not.toBeNull();
    expect(SNAPSHOT_FIXTURE.reasonLocalizationKey).toBeNull();
  });

  it('accepts the Unavailable variant — snapshot null, reason key set', () => {
    expect(UNAVAILABLE_FIXTURE.status).toBe('Unavailable');
    expect(UNAVAILABLE_FIXTURE.snapshot).toBeNull();
    expect(UNAVAILABLE_FIXTURE.reasonLocalizationKey).toBe('Widget:Unavailable');
  });

  it('accepts the Error variant — snapshot null, reason key now set symmetrically with Unavailable', () => {
    expect(ERROR_FIXTURE.status).toBe('Error');
    expect(ERROR_FIXTURE.snapshot).toBeNull();
    expect(ERROR_FIXTURE.reasonLocalizationKey).toBe('Widget:Error.UnknownWidgetType');
  });

  it('round-trips through JSON without mutation', () => {
    for (const fixture of [SNAPSHOT_FIXTURE, UNAVAILABLE_FIXTURE, ERROR_FIXTURE]) {
      expect(JSON.parse(JSON.stringify(fixture))).toEqual(fixture);
    }
  });
});

describe('WidgetSnapshotStatus — exhaustive enum surface (PascalCase)', () => {
  it('locks the three runtime outcomes (Snapshot / Unavailable / Error)', () => {
    const statuses: readonly WidgetSnapshotStatus[] = ['Snapshot', 'Unavailable', 'Error'];
    expect(statuses).toHaveLength(3);
  });
});
