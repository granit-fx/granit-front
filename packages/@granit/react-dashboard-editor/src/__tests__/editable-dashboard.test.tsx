import { defaultWidgetRegistry, WidgetRegistryProvider } from '@granit/react-dashboards';
import { render } from '@testing-library/react';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { EditableDashboard } from '../components/editable-dashboard';

import type { DashboardDefinition } from '@granit/dashboards';
import type { ReactNode } from 'react';

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  nsSeparator: false,
  keySeparator: false,
  resources: {
    en: { translation: { 'Widget:Test.A': 'A', 'Widget:Test.B': 'B' } },
  },
  interpolation: { escapeValue: false },
});

function wrap(node: ReactNode) {
  return render(
    <I18nextProvider i18n={testI18n}>
      <WidgetRegistryProvider registries={[defaultWidgetRegistry]}>{node}</WidgetRegistryProvider>
    </I18nextProvider>
  );
}

const definition: DashboardDefinition = {
  name: 'Test',
  category: 'General',
  isSystem: false,
  version: '1.0.0',
  layout: { columns: 12, rowHeight: 80 },
  widgets: [
    {
      slug: 'A',
      type: 'text',
      position: 0,
      size: { width: 6, height: 1 },
      contentLocalizationKey: 'Widget:Test.A',
      style: 'Body',
    },
    {
      slug: 'B',
      type: 'text',
      position: 1,
      size: { width: 6, height: 1 },
      contentLocalizationKey: 'Widget:Test.B',
      style: 'Body',
    },
  ],
};

describe('EditableDashboard — initial render', () => {
  it('renders one editable cell per widget in position order', () => {
    const { container } = wrap(<EditableDashboard definition={definition} onChange={vi.fn()} />);
    const cells = container.querySelectorAll('[data-slot="editable-dashboard-cell"]');
    expect(cells).toHaveLength(2);
    expect(cells[0]?.getAttribute('data-widget-slug')).toBe('A');
    expect(cells[1]?.getAttribute('data-widget-slug')).toBe('B');
  });

  it('mounts a sortable handle button on every cell with an aria-label', () => {
    const { container } = wrap(<EditableDashboard definition={definition} onChange={vi.fn()} />);
    const handles = container.querySelectorAll('[data-slot="sortable-widget-handle"]');
    expect(handles).toHaveLength(2);
    expect(handles[0]?.getAttribute('aria-label')).toBe('Drag widget A');
  });

  it('respects layout.columns on the grid template', () => {
    const { container } = wrap(<EditableDashboard definition={definition} onChange={vi.fn()} />);
    const root = container.querySelector('[data-slot="editable-dashboard"]');
    expect(root).toHaveStyle({ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' });
  });

  it('honors the rowHeight prop override', () => {
    const { container } = wrap(
      <EditableDashboard definition={definition} onChange={vi.fn()} rowHeight={120} />
    );
    const root = container.querySelector('[data-slot="editable-dashboard"]');
    expect(root).toHaveStyle({ gridAutoRows: '120px' });
  });
});
