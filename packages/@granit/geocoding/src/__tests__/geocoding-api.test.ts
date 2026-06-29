import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { getAddressSuggestions, getReverseGeocode } from '../api/geocoding-api';

import type { GeocodingAutocompleteResponse, GeocodingReverseResponse } from '../types/index';

const basePath = '/api/v1/geocoding';

const sampleAutocomplete: GeocodingAutocompleteResponse = {
  suggestions: [
    {
      label: 'Rue de la Loi 16, 1000 Brussels, BE',
      street: 'Rue de la Loi 16',
      postalCode: '1000',
      locality: 'Brussels',
      country: 'BE',
      latitude: 50.8467,
      longitude: 4.3676,
    },
  ],
};

const sampleReverse: GeocodingReverseResponse = {
  street: 'Rue de la Loi 16',
  postalCode: '1000',
  locality: 'Brussels',
  country: 'BE',
  precision: 'Rooftop',
};

describe('geocoding-api', () => {
  describe('getAddressSuggestions', () => {
    it('should GET {basePath}/autocomplete with q + limit query params', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleAutocomplete });

      const result = await getAddressSuggestions(client, basePath, { q: 'rue de la', limit: 8 });

      expect(client.get).toHaveBeenCalledWith('/api/v1/geocoding/autocomplete', {
        params: { q: 'rue de la', limit: 8 },
        signal: undefined,
      });
      expect(result).toEqual(sampleAutocomplete);
    });

    it('should forward the abort signal so callers can cancel in-flight requests', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleAutocomplete });
      const controller = new AbortController();

      await getAddressSuggestions(client, basePath, { q: 'rue' }, controller.signal);

      expect(client.get).toHaveBeenCalledWith('/api/v1/geocoding/autocomplete', {
        params: { q: 'rue', limit: undefined },
        signal: controller.signal,
      });
    });
  });

  describe('getReverseGeocode', () => {
    it('should GET {basePath}/reverse with lat + lon query params', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleReverse });

      const result = await getReverseGeocode(client, basePath, { lat: 50.8467, lon: 4.3676 });

      expect(client.get).toHaveBeenCalledWith('/api/v1/geocoding/reverse', {
        params: { lat: 50.8467, lon: 4.3676 },
        signal: undefined,
      });
      expect(result).toEqual(sampleReverse);
    });
  });
});
