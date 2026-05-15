import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  entityRelationAggregatesQueryKey,
  useEntityRelationAggregates,
} from '../api/use-entity-relation-aggregates.js';

import type { RelationAggregatesResponse } from '@granit/entities';
import type { ReactNode } from 'react';

const ENTITY = 'Granit.Parties.Party';
const ID = '8c6b1e10-0000-4000-8000-000000000001';
const PATH = `http://localhost/api/v1/entities/${encodeURIComponent(ENTITY)}/${encodeURIComponent(ID)}/relations/aggregates`;

const RESPONSE: RelationAggregatesResponse = {
  aggregates: {
    Invoices: { count: 12, sum: 4500, avg: 375, min: 100, max: 1200, currency: 'EUR' },
    Payments: { count: 8, sum: null, avg: null, min: null, max: null, currency: null },
  },
};

let lastBody: unknown = null;

function freshHandlers() {
  return [
    http.post(PATH, async ({ request }) => {
      lastBody = (await request.text()) || null;
      return HttpResponse.json(RESPONSE);
    }),
  ];
}

const server = setupServer(...freshHandlers());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers(...freshHandlers());
  lastBody = null;
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

describe('useEntityRelationAggregates', () => {
  it('POSTs without a body when relations is omitted (every relation)', async () => {
    const { wrapper, queryClient } = makeWrapper();
    const { result } = renderHook(() => useEntityRelationAggregates(ENTITY, ID), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(RESPONSE);
    expect(lastBody).toBeNull();
    expect(queryClient.getQueryData(entityRelationAggregatesQueryKey(ENTITY, ID))).toEqual(
      RESPONSE
    );
  });

  it('POSTs a sorted relations array when supplied', async () => {
    const { wrapper } = makeWrapper();
    renderHook(
      () =>
        useEntityRelationAggregates(ENTITY, ID, {
          relations: ['Payments', 'Invoices'],
        }),
      { wrapper }
    );
    await waitFor(() => expect(lastBody).not.toBeNull());
    expect(lastBody).toEqual(JSON.stringify({ relations: ['Invoices', 'Payments'] }));
  });

  it('shares the cache slot regardless of relations array order', () => {
    const a = entityRelationAggregatesQueryKey(ENTITY, ID, ['Invoices', 'Payments']);
    const b = entityRelationAggregatesQueryKey(ENTITY, ID, ['Payments', 'Invoices']);
    expect(a).toEqual(b);
    expect(a).not.toEqual(entityRelationAggregatesQueryKey(ENTITY, ID));
  });

  it('honours enabled: false', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useEntityRelationAggregates(ENTITY, ID, { enabled: false }),
      { wrapper }
    );
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('skips the request when entityName or entityId is empty', () => {
    const { wrapper } = makeWrapper();
    const { result: a } = renderHook(() => useEntityRelationAggregates('', ID), { wrapper });
    const { result: b } = renderHook(() => useEntityRelationAggregates(ENTITY, ''), { wrapper });
    expect(a.current.fetchStatus).toBe('idle');
    expect(b.current.fetchStatus).toBe('idle');
  });

  it('surfaces an error message when the endpoint returns 500', async () => {
    server.use(http.post(PATH, () => HttpResponse.json({ error: 'boom' }, { status: 500 })));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityRelationAggregates(ENTITY, ID), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
