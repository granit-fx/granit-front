import axios, { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { executeBulkAction } from '../hooks/bulk-action.js';

import type { BulkActionResponse } from '@granit/entities';

const ENTITY = 'Granit.Sales.Quote';
const ACTION = 'Approve';
const PATH = `http://localhost/api/v1/entities/${encodeURIComponent(ENTITY)}/bulk/${encodeURIComponent(ACTION)}`;

const RESPONSE: BulkActionResponse = {
  ok: ['q-1', 'q-2'],
  failed: [
    {
      id: 'q-3',
      error: 'Workflow transition not allowed in state Draft.',
      errorCode: 'workflow.invalid_transition',
    },
  ],
  parents: ['Party:p-1', 'Party:p-2'],
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

  it('POSTs the ids + parameters bag to /entities/{name}/bulk/{action}', async () => {
    const response = await executeBulkAction(client, ENTITY, ACTION, {
      ids: ['q-1', 'q-2', 'q-3'],
      parameters: { reason: 'Quarterly batch approval' },
    });

    expect(response).toEqual(RESPONSE);
    expect(lastBody).toEqual({
      ids: ['q-1', 'q-2', 'q-3'],
      parameters: { reason: 'Quarterly batch approval' },
    });
  });

  it('omits parameters from the wire body when not provided', async () => {
    await executeBulkAction(client, ENTITY, ACTION, { ids: ['q-1'] });
    expect(lastBody).toEqual({ ids: ['q-1'] });
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
    });

    expect(response.ok).toEqual(['q-1', 'q-2']);
    expect(response.failed).toHaveLength(1);
    expect(response.failed[0]?.id).toBe('q-3');
    expect(response.parents).toEqual(['Party:p-1', 'Party:p-2']);
  });

  it('propagates 422 from the backend with the AxiosError surface intact', async () => {
    server.use(
      http.post(PATH, () => HttpResponse.json({ title: 'Validation failed' }, { status: 422 }))
    );

    await expect(
      executeBulkAction(client, ENTITY, ACTION, { ids: ['q-1'] })
    ).rejects.toBeInstanceOf(AxiosError);
  });

  it('propagates 403 when the caller lacks the action permission', async () => {
    server.use(http.post(PATH, () => HttpResponse.text('forbidden', { status: 403 })));

    await expect(executeBulkAction(client, ENTITY, ACTION, { ids: ['q-1'] })).rejects.toMatchObject(
      { response: { status: 403 } }
    );
  });
});
