import { fireEvent, render } from '@testing-library/react';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { MapConfigForm } from '../editor/map-config-form.js';

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

function wrap(node: ReactNode) {
  return render(<I18nextProvider i18n={testI18n}>{node}</I18nextProvider>);
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
  it('shows the lat / lng column inputs when bound to a lat-lng point source', () => {
    const { container } = wrap(<MapConfigForm widget={baseMap} onChange={vi.fn()} />);
    expect(container.querySelector('[data-slot="map-latitude-column"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="map-longitude-column"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="map-geography-column"]')).toBeNull();
  });

  it('emits an updated query-name on change', () => {
    const onChange = vi.fn();
    const { container } = wrap(<MapConfigForm widget={baseMap} onChange={onChange} />);
    const input = container.querySelector('[data-slot="map-query-name"]');
    if (!(input instanceof HTMLInputElement)) throw new Error('input not found');
    fireEvent.change(input, { target: { value: 'Granit.Test.Branches' } });
    expect(onChange.mock.calls[0]?.[0]?.queryName).toBe('Granit.Test.Branches');
  });

  it('switches to a geography column input when the point-source kind changes', () => {
    const onChange = vi.fn();
    const { container } = wrap(<MapConfigForm widget={baseMap} onChange={onChange} />);
    const select = container.querySelector('[data-slot="map-point-source-kind"]');
    if (!(select instanceof HTMLSelectElement)) throw new Error('select not found');
    fireEvent.change(select, { target: { value: 'geography' } });
    expect(onChange.mock.calls[0]?.[0]?.pointSource).toEqual({
      kind: 'geography',
      geographyColumn: '',
    });
  });

  it('parses comma-separated popup columns into the array shape the backend expects', () => {
    const onChange = vi.fn();
    const { container } = wrap(<MapConfigForm widget={baseMap} onChange={onChange} />);
    const input = container.querySelector('[data-slot="map-popup-columns"]');
    if (!(input instanceof HTMLInputElement)) throw new Error('input not found');
    fireEvent.change(input, { target: { value: ' name , employees ' } });
    expect(onChange.mock.calls[0]?.[0]?.popupColumns).toEqual(['name', 'employees']);
  });

  it('collapses the empty popup-columns input to null (backend convention)', () => {
    const onChange = vi.fn();
    const { container } = wrap(<MapConfigForm widget={baseMap} onChange={onChange} />);
    const input = container.querySelector('[data-slot="map-popup-columns"]');
    if (!(input instanceof HTMLInputElement)) throw new Error('input not found');
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange.mock.calls[0]?.[0]?.popupColumns).toBeNull();
  });

  it('keeps defaultCenter null when only one of lat / lng is provided (avoids backend rejection)', () => {
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
    expect(select).not.toBeNull();
    if (!(select instanceof HTMLSelectElement)) throw new Error('select not found');
    expect(select.value).toBe('');
  });
});
