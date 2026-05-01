import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { entityCalendarQueryKey, useEntityCalendar } from '../api/use-entity-calendar.js';

import type { CalendarItemResponse } from '@granit/entities';
import type { ReactNode } from 'react';

const ENTITY = 'Granit.Invoicing.Invoice';
const PATH = `http://localhost/entities/${encodeURIComponent(ENTITY)}/calendar`;
const FROM = '2026-05-01T00:00:00Z';
const TO = '2026-05-31T23:59:59Z';

const ITEMS: readonly CalendarItemResponse[] = [
  {
    id: '8c6b1e10-0000-4000-8000-000000000001',
    start: '2026-05-04T09:00:00Z',
    end: '2026-05-04T10:30:00Z',
    title: 'INV-001',
    color: 'Blue',
  },
  {
    id: '8c6b1e10-0000-4000-8000-000000000002',
    start: '2026-05-12T00:00:00Z',
    end: null,
    title: 'INV-002',
    color: null,
  },
];

let lastQuery: Record<string, string> | null = null;

function freshHandlers() {
  return [
    http.get(PATH, ({ request }) => {
      const url = new URL(request.url);
      lastQuery = Object.fromEntries(url.searchParams.entries());
      return HttpResponse.json(ITEMS);
    }),
  ];
}

const server = setupServer(...freshHandlers());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers(...freshHandlers());
  lastQuery = null;
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
  return { wrapper, queryClient };
}

describe('useEntityCalendar', () => {
  it('GETs the calendar endpoint with from / to query params', async () => {
    const { wrapper, queryClient } = makeWrapper();
    const { result } = renderHook(() => useEntityCalendar(ENTITY, FROM, TO), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(ITEMS);
    expect(lastQuery).toEqual({ from: FROM, to: TO });
    expect(queryClient.getQueryData(entityCalendarQueryKey(ENTITY, FROM, TO))).toEqual(ITEMS);
  });

  it('forwards calendar=<name> when supplied', async () => {
    const { wrapper } = makeWrapper();
    renderHook(() => useEntityCalendar(ENTITY, FROM, TO, { calendar: 'team' }), { wrapper });
    await waitFor(() => expect(lastQuery).not.toBeNull());
    expect(lastQuery).toEqual({ from: FROM, to: TO, calendar: 'team' });
  });

  it('omits calendar param when null / undefined', async () => {
    const { wrapper } = makeWrapper();
    renderHook(() => useEntityCalendar(ENTITY, FROM, TO, { calendar: null }), { wrapper });
    await waitFor(() => expect(lastQuery).not.toBeNull());
    expect(lastQuery).toEqual({ from: FROM, to: TO });
  });

  it('uses different cache slots per (from, to, calendar)', () => {
    const a = entityCalendarQueryKey(ENTITY, FROM, TO);
    const b = entityCalendarQueryKey(ENTITY, FROM, '2026-06-30T23:59:59Z');
    const c = entityCalendarQueryKey(ENTITY, FROM, TO, 'team');
    expect(a).not.toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('honours enabled: false', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityCalendar(ENTITY, FROM, TO, { enabled: false }), {
      wrapper,
    });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('skips the request when entityName / from / to is empty', () => {
    const { wrapper } = makeWrapper();
    const { result: a } = renderHook(() => useEntityCalendar('', FROM, TO), { wrapper });
    const { result: b } = renderHook(() => useEntityCalendar(ENTITY, '', TO), { wrapper });
    const { result: c } = renderHook(() => useEntityCalendar(ENTITY, FROM, ''), { wrapper });
    expect(a.current.fetchStatus).toBe('idle');
    expect(b.current.fetchStatus).toBe('idle');
    expect(c.current.fetchStatus).toBe('idle');
  });

  it('surfaces an error when the endpoint returns 500', async () => {
    server.use(http.get(PATH, () => HttpResponse.json({ error: 'boom' }, { status: 500 })));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityCalendar(ENTITY, FROM, TO), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('surfaces a 403 (read denied) as an error', async () => {
    server.use(http.get(PATH, () => HttpResponse.json({ detail: 'forbidden' }, { status: 403 })));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityCalendar(ENTITY, FROM, TO), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('returns an empty list when the entity has no calendar layout', async () => {
    server.use(http.get(PATH, () => HttpResponse.json([])));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityCalendar(ENTITY, FROM, TO), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
