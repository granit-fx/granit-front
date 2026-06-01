import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MapTile } from '../components/map-tile';

import type { MapWidgetDefinition } from '@granit/analytics';

const useWidgetRenderMock = vi.fn();

vi.mock('@granit/react-dashboards', () => ({
  useWidgetRender: (...args: unknown[]) => useWidgetRenderMock(...args),
  RenderedWidget: ({ widget }: { widget: unknown }) => (
    <div data-slot="rendered-widget">{JSON.stringify(widget)}</div>
  ),
}));

const WIDGET = {
  type: 'map',
  id: 'w-1',
} as unknown as MapWidgetDefinition;

describe('MapTile', () => {
  it('renders a skeleton while loading', () => {
    useWidgetRenderMock.mockReturnValue({ isLoading: true, isError: false, data: undefined });

    const { container } = render(<MapTile widget={WIDGET} />);
    expect(container.querySelector('[data-slot="map-tile-skeleton"]')).not.toBeNull();
  });

  it('renders an error placeholder when the render query fails', () => {
    useWidgetRenderMock.mockReturnValue({ isLoading: false, isError: true, data: undefined });

    const { container } = render(<MapTile widget={WIDGET} />);
    expect(container.querySelector('[data-slot="map-tile-error"]')).not.toBeNull();
  });

  it('returns null when the query has neither data nor an error', () => {
    useWidgetRenderMock.mockReturnValue({ isLoading: false, isError: false, data: undefined });

    const { container } = render(<MapTile widget={WIDGET} />);
    expect(container.firstChild).toBeNull();
  });

  it('dispatches through RenderedWidget on success', () => {
    useWidgetRenderMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { kind: 'Map', payload: {} },
    });

    render(<MapTile widget={WIDGET} />);
    expect(screen.getByText(/"kind":"Map"/)).not.toBeNull();
  });
});
