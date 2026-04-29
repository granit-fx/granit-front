import { describe, expect, it } from 'vitest';

import { isKpiSnapshotEnvelope } from '../widgets/kpi-snapshot.js';

import type { KpiSnapshotEnvelope } from '../widgets/kpi-snapshot.js';
import type { WidgetSnapshotEnvelope } from '@granit/dashboards';

// Pinned wire-format fixture mirroring what `KpiWidgetInstanceRenderer`
// (B3-2, ADR-039 §7.bis) emits for a successful metric-backed Kpi:
// envelope-level fields (camelCase, PascalCase enums) wrapping a
// MetricSnapshotPayload (also camelCase, PascalCase ValueKind).

const KPI_SNAPSHOT_FIXTURE: KpiSnapshotEnvelope = {
  status: 'Snapshot',
  widgetType: 'Kpi',
  snapshot: {
    value: 12,
    valueKind: 'Count',
    currency: null,
    isHigherBetter: false,
    noData: false,
    previous: {
      value: 14,
      deltaRatio: -0.1428,
      trend: 'down',
      isFavorable: true,
    },
  },
  sequence: 1,
  emittedAt: '2026-04-29T12:34:56.789Z',
  refreshHint: 'Dynamic',
  unavailableReasonLocalizationKey: null,
};

const KPI_UNAVAILABLE_FIXTURE: KpiSnapshotEnvelope = {
  status: 'Unavailable',
  widgetType: 'Kpi',
  snapshot: null,
  sequence: 1,
  emittedAt: '2026-04-29T12:34:56.789Z',
  refreshHint: 'Static',
  unavailableReasonLocalizationKey: 'Widget:Unavailable.QueryAggregateNotImplemented',
};

describe('KpiSnapshotEnvelope — wire format', () => {
  it('accepts the snapshot variant with a fully-populated MetricSnapshotPayload', () => {
    expect(KPI_SNAPSHOT_FIXTURE.widgetType).toBe('Kpi');
    expect(KPI_SNAPSHOT_FIXTURE.snapshot?.valueKind).toBe('Count');
    expect(KPI_SNAPSHOT_FIXTURE.snapshot?.previous?.trend).toBe('down');
  });

  it('accepts the unavailable variant emitted by stub datasource evaluators', () => {
    expect(KPI_UNAVAILABLE_FIXTURE.snapshot).toBeNull();
    expect(KPI_UNAVAILABLE_FIXTURE.unavailableReasonLocalizationKey).toBe(
      'Widget:Unavailable.QueryAggregateNotImplemented'
    );
  });

  it('round-trips through JSON without mutation', () => {
    for (const fixture of [KPI_SNAPSHOT_FIXTURE, KPI_UNAVAILABLE_FIXTURE]) {
      expect(JSON.parse(JSON.stringify(fixture))).toEqual(fixture);
    }
  });
});

describe('isKpiSnapshotEnvelope — type guard', () => {
  it('narrows when widgetType is the Kpi discriminator', () => {
    const generic: WidgetSnapshotEnvelope = KPI_SNAPSHOT_FIXTURE;
    expect(isKpiSnapshotEnvelope(generic)).toBe(true);
    if (isKpiSnapshotEnvelope(generic)) {
      expect(generic.snapshot?.valueKind).toBe('Count');
    }
  });

  it('rejects envelopes carrying a different widgetType', () => {
    const chartEnvelope: WidgetSnapshotEnvelope = {
      ...KPI_SNAPSHOT_FIXTURE,
      widgetType: 'Chart',
      snapshot: null,
    };
    expect(isKpiSnapshotEnvelope(chartEnvelope)).toBe(false);
  });
});
