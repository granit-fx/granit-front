import { composeWrappers, createQueryWrapper } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAddressSuggestions } from '../hooks/use-address-suggestions';
import { GeocodingProvider } from '../providers/geocoding-provider';
import { sampleSuggestions } from '../testing/data';

import type { GeocodingConfig } from '../providers/geocoding-provider';
import type { AxiosInstance } from '@granit/api-client';

function wrapperFor(client: AxiosInstance) {
  const config: GeocodingConfig = { client, basePath: '/api/v1/geocoding' };
  return composeWrappers(createQueryWrapper(), ({ children }) => (
    <GeocodingProvider config={config}>{children}</GeocodingProvider>
  ));
}

/** An Axios-style rejection carrying an HTTP status. */
function httpError(status: number): unknown {
  return { response: { status } };
}

describe('useAddressSuggestions', () => {
  it('stays disabled below the minimum query length', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useAddressSuggestions('ru', { debounceMs: 0 }), {
      wrapper: wrapperFor(client),
    });

    expect(client.get).not.toHaveBeenCalled();
    expect(result.current.suggestions).toEqual([]);
  });

  it('queries and exposes suggestions once the term is long enough', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ suggestions: sampleSuggestions }));

    const { result } = renderHook(() => useAddressSuggestions('rue de la', { debounceMs: 0 }), {
      wrapper: wrapperFor(client),
    });

    await waitFor(() => expect(result.current.suggestions.length).toBe(sampleSuggestions.length));
    expect(client.get).toHaveBeenCalledWith('/api/v1/geocoding/autocomplete', {
      params: { q: 'rue de la', limit: 5 },
      signal: expect.any(AbortSignal),
    });
    expect(result.current.isUnavailable).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('reports isUnavailable (not isError) on a 404 — the capability is absent', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(httpError(404));

    const { result } = renderHook(() => useAddressSuggestions('rue de la', { debounceMs: 0 }), {
      wrapper: wrapperFor(client),
    });

    await waitFor(() => expect(result.current.isUnavailable).toBe(true));
    expect(result.current.isError).toBe(false);
  });

  it('reports isUnavailable and never queries when no provider is in scope', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useAddressSuggestions('rue de la', { debounceMs: 0 }), {
      wrapper: createQueryWrapper(),
    });

    expect(client.get).not.toHaveBeenCalled();
    expect(result.current.isUnavailable).toBe(true);
  });
});
