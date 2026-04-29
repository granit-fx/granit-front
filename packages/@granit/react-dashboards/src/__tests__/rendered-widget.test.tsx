import { render } from '@testing-library/react';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { RenderedWidget } from '../components/rendered-widget.js';
import { defaultSnapshotWidgetRegistry } from '../registry/default-snapshot-widget-registry.js';
import { SnapshotWidgetRegistryProvider } from '../registry/snapshot-widget-registry-context.js';

import type { DashboardRenderedWidget } from '@granit/dashboards';
import type { ReactNode } from 'react';

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  nsSeparator: false,
  keySeparator: false,
  resources: {
    en: {
      translation: {
        'Widget:Test.Banner': 'Hello world',
        'Widget:Test.Heading': 'Section heading',
        'Widget:Test.Logo.Alt': 'Granit logo',
      },
    },
  },
  interpolation: { escapeValue: false },
});

function wrap(node: ReactNode) {
  return render(
    <I18nextProvider i18n={testI18n}>
      <SnapshotWidgetRegistryProvider registries={[defaultSnapshotWidgetRegistry]}>
        {node}
      </SnapshotWidgetRegistryProvider>
    </I18nextProvider>
  );
}

const ENVELOPE_BASE = {
  id: '8c6b1e10-0000-0000-0000-000000000001',
  status: 'Snapshot' as const,
  sequence: 1,
  emittedAt: '2026-04-29T12:34:56.789Z',
  refreshHint: 'Static' as const,
  reasonLocalizationKey: null,
};

describe('RenderedWidget — dispatcher', () => {
  it('routes a Markdown envelope to the built-in MarkdownSnapshotWidget', () => {
    const widget: DashboardRenderedWidget = {
      ...ENVELOPE_BASE,
      widgetType: 'Markdown',
      snapshot: { contentLocalizationKey: 'Widget:Test.Banner' },
    };
    const { container, getByText } = wrap(<RenderedWidget widget={widget} />);
    expect(container.querySelector('[data-slot="markdown-snapshot-widget"]')).not.toBeNull();
    expect(getByText('Hello world')).toBeInTheDocument();
  });

  it('routes a Text envelope to the built-in TextSnapshotWidget with style-aware tag', () => {
    const widget: DashboardRenderedWidget = {
      ...ENVELOPE_BASE,
      widgetType: 'Text',
      snapshot: { contentLocalizationKey: 'Widget:Test.Heading', style: 'Heading' },
    };
    const { container } = wrap(<RenderedWidget widget={widget} />);
    const text = container.querySelector('[data-slot="text-snapshot-widget"]');
    expect(text?.tagName).toBe('H2');
    expect(text?.getAttribute('data-style')).toBe('heading');
  });

  it('routes an Image envelope to the built-in ImageSnapshotWidget', () => {
    const widget: DashboardRenderedWidget = {
      ...ENVELOPE_BASE,
      widgetType: 'Image',
      snapshot: {
        source: 'https://cdn.example/logo.png',
        altLocalizationKey: 'Widget:Test.Logo.Alt',
        fit: 'Contain',
      },
    };
    const { container } = wrap(<RenderedWidget widget={widget} />);
    const img = container.querySelector('img');
    expect(img?.getAttribute('alt')).toBe('Granit logo');
  });

  it('renders an Unavailable slot when the envelope is gated', () => {
    const widget: DashboardRenderedWidget = {
      ...ENVELOPE_BASE,
      widgetType: 'Kpi',
      status: 'Unavailable',
      snapshot: null,
      reasonLocalizationKey: 'Widget:Unavailable.MetricNotFound',
    };
    const { container, getByText } = wrap(<RenderedWidget widget={widget} />);
    const slot = container.querySelector('[data-widget-status="unavailable"]');
    expect(slot).not.toBeNull();
    expect(getByText('Widget:Unavailable.MetricNotFound')).toBeInTheDocument();
  });

  it('renders an Error slot when the renderer threw server-side', () => {
    const widget: DashboardRenderedWidget = {
      ...ENVELOPE_BASE,
      widgetType: 'Chart',
      status: 'Error',
      snapshot: null,
      reasonLocalizationKey: 'Widget:Error.UnknownWidgetType',
    };
    const { container, getByText } = wrap(<RenderedWidget widget={widget} />);
    expect(container.querySelector('[data-widget-status="error"]')).not.toBeNull();
    expect(getByText('Widget:Error.UnknownWidgetType')).toBeInTheDocument();
  });

  it('renders an unknown-kind placeholder when no renderer is registered', () => {
    const widget: DashboardRenderedWidget = {
      ...ENVELOPE_BASE,
      widgetType: 'Kpi',
      snapshot: { value: 12 },
    };
    const { container, getByText } = wrap(<RenderedWidget widget={widget} />);
    expect(container.querySelector('[data-widget-status="unknown-kind"]')).not.toBeNull();
    expect(getByText(/Unknown widget kind: Kpi/)).toBeInTheDocument();
  });
});
