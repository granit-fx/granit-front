import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { MapConfigForm } from '../editor/map-config-form';

import type { MapWidgetDefinition } from '@granit/analytics';
import type { ReactNode } from 'react';

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: {} } },
  interpolation: { escapeValue: false },
});

// The query / column controls use the shared metadata hook (React Query); the
// map editor degrades to free-text when no <QueryCatalogProvider> is present, so
// a bare QueryClientProvider is enough here.
function wrap(node: ReactNode) {
  const queryClient = createTestQueryClient();
  return render(
    <I18nextProvider i18n={testI18n}>
      <QueryClientProvider client={queryClient}>{node}</QueryClientProvider>
    </I18nextProvider>
  );
}

const baseMap: MapWidgetDefinition = {
  slug: 'M',
  type: 'map',
  position: 0,
  size: { width: 6, height: 4 },
  queryName: 'Granit.Test.Customers',
  pointSource: { kind: 'lat-lng', latitudeColumn: 'Latitude', longitudeColumn: 'Longitude' },
  popupColumns: ['name'],
  defaultZoom: 5,
  defaultCenter: null,
  clusterThreshold: 200,
  detailRoute: null,
  tileUrlTemplate: null,
  defaultLayerKind: null,
};

describe('MapConfigForm', () => {
  it('shows the lat / lng column controls when bound to a lat-lng point source', () => {
    const { container } = wrap(<MapConfigForm widget={baseMap} onChange={vi.fn()} />);
    expect(container.querySelector('[data-slot="map-latitude-column"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="map-longitude-column"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="map-geography-column"]')).toBeNull();
  });

  it('emits a typed query name via the catalogue combobox', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = wrap(<MapConfigForm widget={baseMap} onChange={onChange} />);
    await user.click(container.querySelector('[data-slot="map-query-name"]')!);
    await user.type(
      await screen.findByPlaceholderText('Search or type a query name…'),
      'Granit.Test.Branches'
    );
    await user.click(await screen.findByRole('option', { name: /Granit\.Test\.Branches/ }));
    expect(onChange.mock.calls.at(-1)?.[0]?.queryName).toBe('Granit.Test.Branches');
  });

  it('switches to a geography column when the point-source kind changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = wrap(<MapConfigForm widget={baseMap} onChange={onChange} />);
    await user.click(container.querySelector('[data-slot="map-point-source-kind"]')!);
    await user.click(await screen.findByRole('option', { name: 'PostGIS geography column' }));
    expect(onChange.mock.calls.at(-1)?.[0]?.pointSource).toEqual({
      kind: 'geography',
      geographyColumn: '',
    });
  });

  it('adds a popup column through the multi-select (typed value)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = wrap(<MapConfigForm widget={baseMap} onChange={onChange} />);
    await user.click(container.querySelector('[data-slot="map-popup-columns"]')!);
    await user.type(await screen.findByPlaceholderText('Search or type a field…'), 'employees');
    await user.click(await screen.findByRole('option', { name: /employees/ }));
    // Toggled on, on top of the existing `name` column.
    expect(onChange.mock.calls.at(-1)?.[0]?.popupColumns).toEqual(['name', 'employees']);
  });

  it('keeps defaultCenter null when only one of lat / lng is provided', () => {
    const onChange = vi.fn();
    const { container } = wrap(<MapConfigForm widget={baseMap} onChange={onChange} />);
    const lat = container.querySelector('[data-slot="map-default-center-latitude"]');
    if (!(lat instanceof HTMLInputElement)) throw new Error('lat input not found');
    fireEvent.change(lat, { target: { value: '50.85' } });
    expect(onChange.mock.calls[0]?.[0]?.defaultCenter).toBeNull();
  });

  it('produces a complete defaultCenter once both lat + lng are filled in', () => {
    const onChange = vi.fn();
    const seeded: MapWidgetDefinition = {
      ...baseMap,
      defaultCenter: { latitude: 50.85, longitude: 0 },
    };
    const { container } = wrap(<MapConfigForm widget={seeded} onChange={onChange} />);
    const lng = container.querySelector('[data-slot="map-default-center-longitude"]');
    if (!(lng instanceof HTMLInputElement)) throw new Error('lng input not found');
    fireEvent.change(lng, { target: { value: '4.35' } });
    expect(onChange.mock.calls[0]?.[0]?.defaultCenter).toEqual({
      latitude: 50.85,
      longitude: 4.35,
    });
  });

  it('exposes the layer-kind select with a "(provider default)" no-op option', () => {
    const { container } = wrap(<MapConfigForm widget={baseMap} onChange={vi.fn()} />);
    const select = container.querySelector('[data-slot="map-default-layer-kind"]');
    if (!(select instanceof HTMLSelectElement)) throw new Error('select not found');
    expect(select.value).toBe('');
  });
});
