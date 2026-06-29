import { composeWrappers, createQueryWrapper } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useReverseGeocode } from '../hooks/use-reverse-geocode';
import { GeocodingProvider } from '../providers/geocoding-provider';
import { sampleReverseAddress } from '../testing/data';

import type { GeocodingConfig } from '../providers/geocoding-provider';
import type { AxiosInstance } from '@granit/api-client';

function wrapperFor(client: AxiosInstance) {
  const config: GeocodingConfig = { client, basePath: '/api/v1/geocoding' };
  return composeWrappers(createQueryWrapper(), ({ children }) => (
    <GeocodingProvider config={config}>{children}</GeocodingProvider>
  ));
}

function httpError(status: number): unknown {
  return { response: { status } };
}

describe('useReverseGeocode', () => {
  it('stays disabled when no coordinate is given', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useReverseGeocode(null), { wrapper: wrapperFor(client) });

    expect(client.get).not.toHaveBeenCalled();
    expect(result.current.address).toBeNull();
  });

  it('resolves the nearest address for a coordinate', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleReverseAddress));

    const { result } = renderHook(() => useReverseGeocode({ lat: 50.8467, lon: 4.3676 }), {
      wrapper: wrapperFor(client),
    });

    await waitFor(() => expect(result.current.address).toEqual(sampleReverseAddress));
    expect(client.get).toHaveBeenCalledWith('/api/v1/geocoding/reverse', {
      params: { lat: 50.8467, lon: 4.3676 },
      signal: expect.any(AbortSignal),
    });
  });

  it('treats a 422 (out of range) as a quiet no-result, not an error', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(httpError(422));

    const { result } = renderHook(() => useReverseGeocode({ lat: 999, lon: 0 }), {
      wrapper: wrapperFor(client),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.address).toBeNull();
    expect(result.current.isError).toBe(false);
    expect(result.current.isUnavailable).toBe(false);
  });

  it('treats a 404 as unavailable', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(httpError(404));

    const { result } = renderHook(() => useReverseGeocode({ lat: 0, lon: 0 }), {
      wrapper: wrapperFor(client),
    });

    await waitFor(() => expect(result.current.isUnavailable).toBe(true));
    expect(result.current.address).toBeNull();
    expect(result.current.isError).toBe(false);
  });
});
