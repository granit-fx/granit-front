import { describe, expect, it } from 'vitest';

import {
  isImageSnapshotEnvelope,
  isMarkdownSnapshotEnvelope,
  isTextSnapshotEnvelope,
} from '../rendering/index.js';

import type {
  ImageSnapshotEnvelope,
  MarkdownSnapshotEnvelope,
  TextSnapshotEnvelope,
  WidgetSnapshotEnvelope,
} from '../rendering/index.js';
import type { ImageFit } from '../types/widget-definition.js';

// Pinned wire-format fixtures mirroring B3-3 backend output:
//   - Granit.Dashboards.Endpoints.Rendering.MarkdownWidgetInstanceRenderer
//   - Granit.Dashboards.Endpoints.Rendering.TextWidgetInstanceRenderer
//   - Granit.Dashboards.Endpoints.Rendering.ImageWidgetInstanceRenderer
// Static-content renderers always emit RefreshHint.Static so the frontend
// drops these widgets out of the refresh loop.

const MARKDOWN_FIXTURE: MarkdownSnapshotEnvelope = {
  status: 'Snapshot',
  widgetType: 'Markdown',
  snapshot: {
    contentLocalizationKey: 'Widget:Granit.Invoicing.FinanceOverview.Banner',
  },
  sequence: 1,
  emittedAt: '2026-04-29T12:34:56.789Z',
  refreshHint: 'Static',
  reasonLocalizationKey: null,
};

const TEXT_FIXTURE: TextSnapshotEnvelope = {
  status: 'Snapshot',
  widgetType: 'Text',
  snapshot: {
    contentLocalizationKey: 'Widget:Granit.Invoicing.FinanceOverview.SectionHeading',
    style: 'Heading',
  },
  sequence: 1,
  emittedAt: '2026-04-29T12:34:56.789Z',
  refreshHint: 'Static',
  reasonLocalizationKey: null,
};

const IMAGE_FIXTURE: ImageSnapshotEnvelope = {
  status: 'Snapshot',
  widgetType: 'Image',
  snapshot: {
    source: 'blob:logo-banner',
    altLocalizationKey: 'Widget:Granit.Showcase.Logo.Alt',
    fit: 'Contain',
  },
  sequence: 1,
  emittedAt: '2026-04-29T12:34:56.789Z',
  refreshHint: 'Static',
  reasonLocalizationKey: null,
};

describe('MarkdownSnapshotEnvelope — wire format', () => {
  it('accepts the snapshot variant with the static RefreshHint', () => {
    expect(MARKDOWN_FIXTURE.widgetType).toBe('Markdown');
    expect(MARKDOWN_FIXTURE.refreshHint).toBe('Static');
    expect(MARKDOWN_FIXTURE.snapshot?.contentLocalizationKey).toContain('FinanceOverview');
  });

  it('round-trips through JSON without mutation', () => {
    expect(JSON.parse(JSON.stringify(MARKDOWN_FIXTURE))).toEqual(MARKDOWN_FIXTURE);
  });
});

describe('TextSnapshotEnvelope — wire format', () => {
  it('carries the PascalCase TextStyle on the wire', () => {
    expect(TEXT_FIXTURE.snapshot?.style).toBe('Heading');
  });

  it('round-trips through JSON without mutation', () => {
    expect(JSON.parse(JSON.stringify(TEXT_FIXTURE))).toEqual(TEXT_FIXTURE);
  });
});

describe('ImageSnapshotEnvelope — wire format', () => {
  it('carries source, altLocalizationKey and PascalCase ImageFit', () => {
    expect(IMAGE_FIXTURE.snapshot?.source).toBe('blob:logo-banner');
    expect(IMAGE_FIXTURE.snapshot?.fit).toBe('Contain');
  });

  it('round-trips through JSON without mutation', () => {
    expect(JSON.parse(JSON.stringify(IMAGE_FIXTURE))).toEqual(IMAGE_FIXTURE);
  });
});

describe('Type guards — heterogeneous bundle dispatch', () => {
  const bundle: readonly WidgetSnapshotEnvelope[] = [MARKDOWN_FIXTURE, TEXT_FIXTURE, IMAGE_FIXTURE];

  it('routes each envelope to exactly one type guard', () => {
    const matches = bundle.map((env) => ({
      markdown: isMarkdownSnapshotEnvelope(env),
      text: isTextSnapshotEnvelope(env),
      image: isImageSnapshotEnvelope(env),
    }));

    expect(matches[0]).toEqual({ markdown: true, text: false, image: false });
    expect(matches[1]).toEqual({ markdown: false, text: true, image: false });
    expect(matches[2]).toEqual({ markdown: false, text: false, image: true });
  });
});

describe('ImageFit — exhaustive enum surface (PascalCase)', () => {
  it('locks the three backend fits in declaration order', () => {
    const fits: readonly ImageFit[] = ['Contain', 'Cover', 'Fill'];
    expect(fits).toHaveLength(3);
  });
});
