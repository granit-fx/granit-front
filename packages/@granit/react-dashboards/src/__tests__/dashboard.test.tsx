import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Dashboard } from '../components/dashboard.js';
import { defaultWidgetRegistry } from '../registry/default-widget-registry.js';
import { WidgetRegistryProvider } from '../registry/widget-registry-context.js';

import type { DashboardDefinition } from '@granit/dashboards';

function renderDashboard(definition: DashboardDefinition) {
  return render(
    <WidgetRegistryProvider registries={[defaultWidgetRegistry]}>
      <Dashboard definition={definition} />
    </WidgetRegistryProvider>
  );
}

describe('Dashboard', () => {
  it('renders widgets at their grid positions', () => {
    const { container } = renderDashboard({
      id: 'test',
      name: 'Test',
      category: 'general',
      widgets: [
        { id: 'w1', type: 'text', title: 'Hello', content: 'World' },
        { id: 'w2', type: 'markdown', content: '# Heading' },
      ],
      layout: {
        columns: 12,
        items: [
          { widgetId: 'w1', position: { x: 0, y: 0, width: 6, height: 1 } },
          { widgetId: 'w2', position: { x: 6, y: 0, width: 6, height: 1 } },
        ],
      },
    });

    expect(screen.getByText('World')).toBeInTheDocument();
    expect(screen.getByText('# Heading')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="dashboard-cell"]')).toHaveLength(2);
  });

  it('skips layout items with no matching widget', () => {
    const { container } = renderDashboard({
      id: 'test',
      name: 'Test',
      category: 'general',
      widgets: [{ id: 'w1', type: 'text', content: 'Only one' }],
      layout: {
        columns: 12,
        items: [
          { widgetId: 'w1', position: { x: 0, y: 0, width: 6, height: 1 } },
          { widgetId: 'ghost', position: { x: 6, y: 0, width: 6, height: 1 } },
        ],
      },
    });
    expect(container.querySelectorAll('[data-slot="dashboard-cell"]')).toHaveLength(1);
  });

  it('renders an unknown-widget placeholder when the type has no registered renderer', () => {
    render(
      <WidgetRegistryProvider registries={[defaultWidgetRegistry]}>
        <Dashboard
          definition={{
            id: 'test',
            name: 'Test',
            category: 'general',
            widgets: [
              {
                id: 'w1',
                type: 'analytics-kpi',
                metric: 'foo',
              } as never,
            ],
            layout: {
              columns: 12,
              items: [{ widgetId: 'w1', position: { x: 0, y: 0, width: 6, height: 1 } }],
            },
          }}
        />
      </WidgetRegistryProvider>
    );
    expect(screen.getByText(/Unknown widget type/i)).toBeInTheDocument();
    expect(screen.getByText(/analytics-kpi/)).toBeInTheDocument();
  });

  it('applies grid-template-columns from layout.columns', () => {
    const { container } = renderDashboard({
      id: 'test',
      name: 'Test',
      category: 'general',
      widgets: [],
      layout: { columns: 8, items: [] },
    });
    const dashboard = container.querySelector('[data-slot="dashboard"]');
    expect(dashboard).toHaveStyle({ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' });
  });
});
