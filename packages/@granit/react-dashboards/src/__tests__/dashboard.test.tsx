import { render, screen } from '@testing-library/react';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { Dashboard } from '../components/dashboard';
import { defaultWidgetRegistry } from '../registry/default-widget-registry';
import { WidgetRegistryProvider } from '../registry/widget-registry-context';

import type { DashboardDefinition } from '@granit/dashboards';

// Bootstraps a minimal i18next instance so Markdown / Text / Image widgets can
// resolve their localization keys to the English fixture content used below.
//
// `nsSeparator: false` and `keySeparator: false` disable i18next's default
// `namespace:key` and `key.subkey` parsing — Granit uses flat keys with `:`
// and `.` as plain characters (e.g. `Widget:DashboardName.Slug.Title`).
const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  nsSeparator: false,
  keySeparator: false,
  resources: {
    en: {
      translation: {
        'Widget:Test.Hello': 'World',
        'Widget:Test.Heading': '# Heading',
        'Widget:Test.Caption': 'Read me',
        'Widget:Test.Logo.Alt': 'Granit logo',
      },
    },
  },
  interpolation: { escapeValue: false },
});

function renderDashboard(definition: DashboardDefinition) {
  return render(
    <I18nextProvider i18n={testI18n}>
      <WidgetRegistryProvider registries={[defaultWidgetRegistry]}>
        <Dashboard definition={definition} />
      </WidgetRegistryProvider>
    </I18nextProvider>
  );
}

describe('Dashboard', () => {
  it('renders widgets in grid-coordinate (y,x) order with their declared size', () => {
    const { container } = renderDashboard({
      name: 'Test',
      category: 'General',
      isSystem: false,
      version: '1.0.0',
      layout: { columns: 12, rowHeight: 80 },
      widgets: [
        {
          slug: 'Hello',
          type: 'text',
          x: 0,
          y: 1,
          size: { width: 6, height: 1 },
          contentLocalizationKey: 'Widget:Test.Hello',
          style: 'Body',
        },
        {
          slug: 'Heading',
          type: 'markdown',
          x: 0,
          y: 0,
          size: { width: 6, height: 1 },
          contentLocalizationKey: 'Widget:Test.Heading',
        },
      ],
    });

    expect(screen.getByText('World')).toBeInTheDocument();
    expect(screen.getByText('# Heading')).toBeInTheDocument();

    const cells = container.querySelectorAll('[data-slot="dashboard-cell"]');
    expect(cells).toHaveLength(2);
    // The cell at y:0 (Heading) renders first in DOM.
    expect(cells[0]?.getAttribute('data-widget-slug')).toBe('Heading');
    expect(cells[1]?.getAttribute('data-widget-slug')).toBe('Hello');
  });

  it('applies grid-template-columns from layout.columns', () => {
    const { container } = renderDashboard({
      name: 'Empty',
      category: 'General',
      isSystem: false,
      version: '1.0.0',
      layout: { columns: 8, rowHeight: 80 },
      widgets: [],
    });
    const dashboard = container.querySelector('[data-slot="dashboard"]');
    expect(dashboard).toHaveStyle({ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' });
  });

  it('renders an unknown-widget placeholder when the type has no registered renderer', () => {
    renderDashboard({
      name: 'Test',
      category: 'General',
      isSystem: false,
      version: '1.0.0',
      layout: { columns: 12, rowHeight: 80 },
      widgets: [
        {
          slug: 'Foo',
          type: 'analytics-kpi',
          x: 0,
          y: 0,
          size: { width: 3, height: 1 },
          metric: 'foo',
        } as never,
      ],
    });
    expect(screen.getByText(/Unknown widget type/i)).toBeInTheDocument();
    expect(screen.getByText(/analytics-kpi/)).toBeInTheDocument();
  });

  it('renders the TextWidget with style-aware HTML element', () => {
    const { container } = renderDashboard({
      name: 'Test',
      category: 'General',
      isSystem: false,
      version: '1.0.0',
      layout: { columns: 12, rowHeight: 80 },
      widgets: [
        {
          slug: 'Caption',
          type: 'text',
          x: 0,
          y: 0,
          size: { width: 6, height: 1 },
          contentLocalizationKey: 'Widget:Test.Caption',
          style: 'Caption',
        },
      ],
    });
    const text = container.querySelector('[data-slot="text-widget"]');
    expect(text?.tagName).toBe('P');
    expect(text?.getAttribute('data-style')).toBe('caption');
  });
});
