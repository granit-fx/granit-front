import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RichMarkdownSnapshotWidget } from '../components/widgets/markdown-snapshot-widget';
import { RichMarkdownWidget } from '../components/widgets/markdown-widget';
import {
  markdownSnapshotWidgetRegistry,
  markdownWidgetRegistry,
} from '../registry/markdown-widget-registry';

import { renderDashboards } from './test-utils';

import type { DashboardRenderedWidget, MarkdownWidgetDefinition } from '@granit/dashboards';

// The renderers resolve content through i18next; test-utils' instance has no
// Widget:* keys, so `t()` falls back to the key's `defaultValue` — which the
// renderers set to the raw Markdown source. That's exactly what we want to
// assert parses (no locale bundle needed).
const bannerWidget: MarkdownWidgetDefinition = {
  slug: 'banner',
  type: 'markdown',
  size: { width: 12, height: 1 },
  contentLocalizationKey: '## Tiers',
};

const bannerSnapshot = {
  slug: 'banner',
  widgetType: 'Markdown',
  snapshot: { contentLocalizationKey: '## Tiers' },
} as unknown as DashboardRenderedWidget;

describe('RichMarkdownWidget (definition side)', () => {
  it('renders Markdown headings instead of raw source', () => {
    renderDashboards(<RichMarkdownWidget widget={bannerWidget} />);

    const heading = screen.getByRole('heading', { level: 2, name: 'Tiers' });
    expect(heading).toBeInTheDocument();
    // The literal "## Tiers" must not survive as text.
    expect(heading.textContent).toBe('Tiers');
  });
});

describe('RichMarkdownSnapshotWidget (runtime snapshot side)', () => {
  it('renders Markdown headings from the snapshot envelope', () => {
    renderDashboards(<RichMarkdownSnapshotWidget widget={bannerSnapshot} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Tiers' })).toBeInTheDocument();
  });

  it('returns null for a non-Markdown envelope', () => {
    const kpi = {
      slug: 'k',
      widgetType: 'Kpi',
      snapshot: { value: 1 },
    } as unknown as DashboardRenderedWidget;

    const { container } = renderDashboards(<RichMarkdownSnapshotWidget widget={kpi} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('registry fragments', () => {
  it('override the framework `markdown` / `Markdown` keys', () => {
    expect(markdownWidgetRegistry.markdown).toBe(RichMarkdownWidget);
    expect(markdownSnapshotWidgetRegistry.Markdown).toBe(RichMarkdownSnapshotWidget);
  });
});
