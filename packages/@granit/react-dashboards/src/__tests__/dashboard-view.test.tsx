import { fireEvent, render } from '@testing-library/react';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { Dashboard } from '../components/dashboard';
import { DashboardViewSwitcher } from '../components/dashboard-view-switcher';
import { defaultWidgetRegistry } from '../registry/default-widget-registry';
import { WidgetRegistryProvider } from '../registry/widget-registry-context';

import type { DashboardDefinition, WidgetDefinition } from '@granit/dashboards';
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
        'Dashboard:Granit.Test.MultiView.View.list': 'List',
        'Dashboard:Granit.Test.MultiView.View.detail': 'Detail',
      },
    },
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

const widget = (slug: string, position: number): WidgetDefinition =>
  ({
    slug,
    type: 'markdown',
    position,
    size: { width: 12, height: 1 },
    contentLocalizationKey: `Widget:${slug}.Content`,
  }) as WidgetDefinition;

const multiView: DashboardDefinition = {
  name: 'Granit.Test.MultiView',
  category: 'General',
  isSystem: false,
  version: '1.0.0',
  layout: { columns: 12, rowHeight: 80 },
  widgets: [widget('top-banner', 0)],
  views: [
    { name: 'list', widgets: [widget('list-banner', 0)] },
    { name: 'detail', widgets: [widget('detail-kpi', 0)] },
  ],
  defaultView: 'list',
};

describe('<Dashboard /> — multi-view rendering', () => {
  it('renders the default view widgets when uncontrolled', () => {
    const { container } = wrap(<Dashboard definition={multiView} />);
    const cells = container.querySelectorAll('[data-slot="dashboard-cell"]');
    expect(cells).toHaveLength(1);
    expect(cells[0]?.getAttribute('data-widget-slug')).toBe('list-banner');
  });

  it('honours the controlled `currentView` prop', () => {
    const { container } = wrap(<Dashboard definition={multiView} currentView="detail" />);
    const cells = container.querySelectorAll('[data-slot="dashboard-cell"]');
    expect(cells[0]?.getAttribute('data-widget-slug')).toBe('detail-kpi');
  });

  it('exposes the active view name as a data-attribute on the grid root', () => {
    const { container } = wrap(<Dashboard definition={multiView} currentView="detail" />);
    const root = container.querySelector('[data-slot="dashboard"]');
    expect(root?.getAttribute('data-current-view')).toBe('detail');
  });

  it('falls back to the top-level pool when views are absent (single-view)', () => {
    const single: DashboardDefinition = { ...multiView, views: undefined, defaultView: undefined };
    const { container } = wrap(<Dashboard definition={single} />);
    const cells = container.querySelectorAll('[data-slot="dashboard-cell"]');
    expect(cells[0]?.getAttribute('data-widget-slug')).toBe('top-banner');
  });
});

describe('<DashboardViewSwitcher />', () => {
  it('renders nothing when views is null / empty', () => {
    const empty1 = wrap(<DashboardViewSwitcher views={null} onChange={vi.fn()} />);
    expect(empty1.container.querySelector('[data-slot="dashboard-view-switcher"]')).toBeNull();

    const empty2 = wrap(<DashboardViewSwitcher views={[]} onChange={vi.fn()} />);
    expect(empty2.container.querySelector('[data-slot="dashboard-view-switcher"]')).toBeNull();
  });

  it('renders nothing when no setter is available (no onChange + no surrounding provider)', () => {
    const { container } = wrap(<DashboardViewSwitcher views={multiView.views} />);
    expect(container.querySelector('[data-slot="dashboard-view-switcher"]')).toBeNull();
  });

  it('renders one tab per view in controlled mode', () => {
    const { container } = wrap(
      <DashboardViewSwitcher views={multiView.views} currentView="list" onChange={vi.fn()} />
    );
    const tabs = container.querySelectorAll('[data-slot="dashboard-view-switcher-tab"]');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]?.getAttribute('data-view-name')).toBe('list');
    expect(tabs[1]?.getAttribute('data-view-name')).toBe('detail');
  });

  it('marks the active tab via data-active + aria-selected', () => {
    const { container } = wrap(
      <DashboardViewSwitcher views={multiView.views} currentView="detail" onChange={vi.fn()} />
    );
    const tabs = Array.from(
      container.querySelectorAll('[data-slot="dashboard-view-switcher-tab"]')
    );
    const detailTab = tabs.find((t) => t.getAttribute('data-view-name') === 'detail');
    const listTab = tabs.find((t) => t.getAttribute('data-view-name') === 'list');
    expect(detailTab?.getAttribute('aria-selected')).toBe('true');
    expect(listTab?.getAttribute('aria-selected')).toBe('false');
  });

  it('dispatches onChange with the clicked view name', () => {
    const onChange = vi.fn();
    const { container } = wrap(
      <DashboardViewSwitcher views={multiView.views} currentView="list" onChange={onChange} />
    );
    const detailTab = container.querySelector(
      '[data-slot="dashboard-view-switcher-tab"][data-view-name="detail"]'
    );
    if (!(detailTab instanceof HTMLElement)) throw new Error('detail tab not found');
    fireEvent.click(detailTab);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('detail');
  });
});
