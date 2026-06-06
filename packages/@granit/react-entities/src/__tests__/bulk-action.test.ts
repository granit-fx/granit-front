import { executeBulkAction } from '@granit/entities';
import axios, { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import type { BulkActionResponse } from '@granit/entities';

const ENTITY = 'Granit.Sales.Quote';
const ACTION = 'Approve';
const PATH = `http://localhost/api/v1/entities/${encodeURIComponent(ENTITY)}/bulk/${encodeURIComponent(ACTION)}`;

const RESPONSE: BulkActionResponse = {
  affected: 2,
  failures: [{ id: 'q-3', reason: 'Workflow transition not allowed in state Draft.' }],
};

let lastBody: unknown = null;

function freshHandlers() {
  return [
    http.post(PATH, async ({ request }) => {
      lastBody = await request.json();
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

describe('executeBulkAction', () => {
  const client = axios.create({ baseURL: 'http://localhost' });

  it('POSTs the ids + payload to /entities/{name}/bulk/{action}', async () => {
    const response = await executeBulkAction(client, ENTITY, ACTION, {
      ids: ['q-1', 'q-2', 'q-3'],
      payload: { reason: 'Quarterly batch approval' },
    });

    expect(response).toEqual(RESPONSE);
    expect(lastBody).toEqual({
      ids: ['q-1', 'q-2', 'q-3'],
      payload: { reason: 'Quarterly batch approval' },
    });
  });

  it('sends payload:null when there is no action-specific data', async () => {
    await executeBulkAction(client, ENTITY, ACTION, { ids: ['q-1'], payload: null });
    expect(lastBody).toEqual({ ids: ['q-1'], payload: null });
  });

  it('URI-encodes the entity name and the action segment', async () => {
    const tricky = 'Tenant.Module.Entity Name';
    const trickyAction = 'Mark Done';
    const url = `http://localhost/api/v1/entities/${encodeURIComponent(tricky)}/bulk/${encodeURIComponent(trickyAction)}`;
    server.use(http.post(url, () => HttpResponse.json(RESPONSE)));

    const response = await executeBulkAction(client, tricky, trickyAction, { ids: ['x-1'] });

    expect(response).toEqual(RESPONSE);
  });

  it('returns the partial-failure recap as-is so the caller can drive retry UX', async () => {
    const response = await executeBulkAction(client, ENTITY, ACTION, {
      ids: ['q-1', 'q-2', 'q-3'],
      payload: null,
    });

    expect(response.affected).toBe(2);
    expect(response.failures).toHaveLength(1);
    expect(response.failures[0]?.id).toBe('q-3');
    expect(response.failures[0]?.reason).toContain('Workflow transition');
  });

  it('propagates 422 from the backend with the AxiosError surface intact', async () => {
    server.use(
      http.post(PATH, () => HttpResponse.json({ title: 'Validation failed' }, { status: 422 }))
    );

    await expect(
      executeBulkAction(client, ENTITY, ACTION, { ids: ['q-1'], payload: null })
    ).rejects.toBeInstanceOf(AxiosError);
  });

  it('propagates 403 when the caller lacks the action permission', async () => {
    server.use(http.post(PATH, () => HttpResponse.text('forbidden', { status: 403 })));

    await expect(
      executeBulkAction(client, ENTITY, ACTION, { ids: ['q-1'], payload: null })
    ).rejects.toMatchObject({ response: { status: 403 } });
  });
});
