import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  landingRouteQueryKey,
  useLandingRoute,
  useSetLandingPin,
} from '../api/use-landing-route.js';

import type { LandingRouteResponse } from '@granit/workspaces';
import type { ReactNode } from 'react';

const ROUTE: LandingRouteResponse = {
  route: '/w/Granit.Framework',
  source: 'Framework',
};

let getCalls = 0;
let lastPinBody: unknown = null;

function freshHandlers() {
  return [
    http.get('http://localhost/me/landing-route', () => {
      getCalls += 1;
      return HttpResponse.json(ROUTE);
    }),
    http.put('http://localhost/me/landing-route/pinned', async ({ request }) => {
      lastPinBody = await request.json();
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

const server = setupServer(...freshHandlers());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers(...freshHandlers());
  getCalls = 0;
  lastPinBody = null;
});
afterAll(() => server.close());

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={apiClient}>{children}</GranitClientProvider>
    </QueryClientProvider>
  );
  return { wrapper, queryClient };
}

describe('useLandingRoute', () => {
  it('returns the resolved route + tier', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useLandingRoute(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(ROUTE);
  });

  it('caches under the landing-route query key', async () => {
    const { wrapper, queryClient } = makeWrapper();
    const { result } = renderHook(() => useLandingRoute(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(landingRouteQueryKey())).toEqual(ROUTE);
  });

  it('honours enabled: false', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useLandingRoute({ enabled: false }), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(getCalls).toBe(0);
  });
});

describe('useSetLandingPin', () => {
  it('PUTs the route to /me/landing-route/pinned', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useSetLandingPin(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ route: '/w/Granit.Showcase.CRM' });
    });

    expect(lastPinBody).toEqual({ route: '/w/Granit.Showcase.CRM' });
  });

  it('accepts null to clear the pin', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useSetLandingPin(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ route: null });
    });

    expect(lastPinBody).toEqual({ route: null });
  });

  it('invalidates the landing-route cache on success', async () => {
    const { wrapper, queryClient } = makeWrapper();
    const { result: routeResult } = renderHook(() => useLandingRoute(), { wrapper });
    await waitFor(() => expect(routeResult.current.isSuccess).toBe(true));
    expect(getCalls).toBe(1);

    const { result: pinResult } = renderHook(() => useSetLandingPin(), { wrapper });
    await act(async () => {
      await pinResult.current.mutateAsync({ route: '/w/X' });
    });

    await waitFor(() => expect(getCalls).toBe(2));
    expect(queryClient.getQueryState(landingRouteQueryKey())?.isInvalidated).toBe(false);
  });
});
