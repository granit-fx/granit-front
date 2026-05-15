import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { useLandingRedirect } from '../hooks/use-landing-redirect.js';

import type { LandingRouteResponse } from '@granit/workspaces';
import type { ReactNode } from 'react';

const ROUTE: LandingRouteResponse = {
  route: '/w/Granit.Showcase.CRM',
  source: 'PersonalSticky',
};

let getCalls = 0;

function freshHandlers() {
  return [
    http.get('http://localhost/api/v1/me/landing-route', () => {
      getCalls += 1;
      return HttpResponse.json(ROUTE);
    }),
  ];
}

const server = setupServer(...freshHandlers());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers(...freshHandlers());
  getCalls = 0;
});
afterAll(() => server.close());

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={apiClient}>{children}</GranitClientProvider>
    </QueryClientProvider>
  );
  return { wrapper };
}

describe('useLandingRedirect', () => {
  it('navigates once with the resolved route after the query lands', async () => {
    const { wrapper } = makeWrapper();
    const navigate = vi.fn();
    const { result } = renderHook(() => useLandingRedirect(navigate), { wrapper });

    expect(result.current.isResolving).toBe(true);
    expect(result.current.hasRedirected).toBe(false);

    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    expect(navigate).toHaveBeenCalledWith(ROUTE.route);
    expect(result.current.resolved).toEqual(ROUTE);
  });

  it('only fires once even on re-renders', async () => {
    const { wrapper } = makeWrapper();
    const navigate = vi.fn();
    const { rerender } = renderHook(() => useLandingRedirect(navigate), { wrapper });

    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    rerender();
    rerender();
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('skips the redirect when enabled is false', async () => {
    const { wrapper } = makeWrapper();
    const navigate = vi.fn();
    renderHook(() => useLandingRedirect(navigate, { enabled: false }), { wrapper });

    // Wait long enough for a fetch to have happened if it were going to.
    await new Promise((r) => setTimeout(r, 50));
    expect(navigate).not.toHaveBeenCalled();
    expect(getCalls).toBe(0);
  });

  it('invokes onResolved before navigating', async () => {
    const { wrapper } = makeWrapper();
    const navigate = vi.fn();
    const onResolved = vi.fn();
    renderHook(() => useLandingRedirect(navigate, { onResolved }), { wrapper });

    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    expect(onResolved).toHaveBeenCalledWith(ROUTE);
  });
});
