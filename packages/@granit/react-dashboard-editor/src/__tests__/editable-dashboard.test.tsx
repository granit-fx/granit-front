import { defaultWidgetRegistry, WidgetRegistryProvider } from '@granit/react-dashboards';
import { fireEvent, render } from '@testing-library/react';
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

  it('mounts a drag handle on every cell with an aria-label', () => {
    const { container } = wrap(<EditableDashboard definition={definition} onChange={vi.fn()} />);
    const handles = container.querySelectorAll('[data-slot="sortable-widget-handle"]');
    expect(handles).toHaveLength(2);
    expect(handles[0]?.getAttribute('aria-label')).toBe('Move widget A');
    // The handle carries the class the grid's dragConfig.handle selector targets.
    expect(handles[0]?.classList.contains('granit-drag-handle')).toBe(true);
  });

  it('renders a react-grid-layout surface under the editable-dashboard slot', () => {
    const { container } = wrap(<EditableDashboard definition={definition} onChange={vi.fn()} />);
    const root = container.querySelector('[data-slot="editable-dashboard"]');
    expect(root?.querySelector('.react-grid-layout')).not.toBeNull();
  });

  it('drives cell height from the row height (1-row widget = rowHeight px)', () => {
    const { container } = wrap(
      <EditableDashboard definition={definition} onChange={vi.fn()} rowHeight={120} />
    );
    const cell = container.querySelector<HTMLElement>('[data-slot="editable-dashboard-cell"]');
    // react-grid-layout sizes the item from rowHeight × h (1 row here) — no
    // DOM measurement involved, so it's deterministic in JSDOM.
    expect(cell?.style.height).toBe('120px');
  });

  it('exposes eight resize handles per cell (corners + edges)', () => {
    const { container } = wrap(<EditableDashboard definition={definition} onChange={vi.fn()} />);
    const firstCell = container.querySelector('[data-slot="editable-dashboard-cell"]');
    const handles = firstCell?.querySelectorAll('[data-slot="sortable-widget-resize-handle"]');
    expect(handles?.length).toBe(8);
  });
});

describe('EditableDashboard — hover action toolbar', () => {
  it('renders no toolbar when no action callbacks are wired', () => {
    const { container } = wrap(<EditableDashboard definition={definition} onChange={vi.fn()} />);
    expect(container.querySelector('[data-slot="widget-action-toolbar"]')).toBeNull();
  });

  it('shows only the actions whose callbacks are supplied', () => {
    const { container } = wrap(
      <EditableDashboard definition={definition} onChange={vi.fn()} onEditWidget={vi.fn()} />
    );
    const firstCell = container.querySelector('[data-slot="editable-dashboard-cell"]');
    expect(firstCell?.querySelector('[data-slot="widget-action-edit"]')).not.toBeNull();
    expect(firstCell?.querySelector('[data-slot="widget-action-duplicate"]')).toBeNull();
    expect(firstCell?.querySelector('[data-slot="widget-action-delete"]')).toBeNull();
  });

  it('invokes each action with the widget slug', () => {
    const onEditWidget = vi.fn();
    const onDuplicateWidget = vi.fn();
    const onDeleteWidget = vi.fn();
    const { container } = wrap(
      <EditableDashboard
        definition={definition}
        onChange={vi.fn()}
        onEditWidget={onEditWidget}
        onDuplicateWidget={onDuplicateWidget}
        onDeleteWidget={onDeleteWidget}
      />
    );
    const firstCell = container.querySelector('[data-slot="editable-dashboard-cell"]');
    fireEvent.click(firstCell!.querySelector('[data-slot="widget-action-edit"]')!);
    fireEvent.click(firstCell!.querySelector('[data-slot="widget-action-duplicate"]')!);
    fireEvent.click(firstCell!.querySelector('[data-slot="widget-action-delete"]')!);
    expect(onEditWidget).toHaveBeenCalledWith('A');
    expect(onDuplicateWidget).toHaveBeenCalledWith('A');
    expect(onDeleteWidget).toHaveBeenCalledWith('A');
  });
});
