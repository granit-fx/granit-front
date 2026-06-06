import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { getLandingRoute, getWorkspaceTree, setPinnedLandingRoute } from '../api/workspaces-api';

import type { LandingRouteResponse, WorkspaceTreeResponse } from '../types/index';

const BASE = 'http://localhost';
const BASE_PATH = '/api/v1';

const TREE: WorkspaceTreeResponse = {
  schemaVersion: 1,
  workspaces: [],
};

const LANDING_ROUTE: LandingRouteResponse = {
  route: '/w/Granit.Framework',
  source: 'Framework',
};

const server = setupServer(
  http.get(`${BASE}${BASE_PATH}/workspaces`, () => HttpResponse.json(TREE)),
  http.get(`${BASE}${BASE_PATH}/me/landing-route`, () => HttpResponse.json(LANDING_ROUTE)),
  http.put(
    `${BASE}${BASE_PATH}/me/landing-route/pinned`,
    () => new HttpResponse(null, { status: 204 })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const client = axios.create({ baseURL: BASE });

describe('getWorkspaceTree', () => {
  it('GETs /workspaces and returns the tree', async () => {
    const result = await getWorkspaceTree(client, BASE_PATH);
    expect(result).toEqual(TREE);
  });

  it('passes includeShells=false as a query param', async () => {
    let capturedSearch = '';
    server.use(
      http.get(`${BASE}${BASE_PATH}/workspaces`, ({ request }) => {
        capturedSearch = new URL(request.url).search;
        return HttpResponse.json(TREE);
      })
    );
    await getWorkspaceTree(client, BASE_PATH, { includeShells: false });
    expect(capturedSearch).toContain('includeShells=false');
  });

  it('passes includeShells=true as a query param', async () => {
    let capturedSearch = '';
    server.use(
      http.get(`${BASE}${BASE_PATH}/workspaces`, ({ request }) => {
        capturedSearch = new URL(request.url).search;
        return HttpResponse.json(TREE);
      })
    );
    await getWorkspaceTree(client, BASE_PATH, { includeShells: true });
    expect(capturedSearch).toContain('includeShells=true');
  });

  it('omits includeShells when not provided', async () => {
    let capturedSearch = '';
    server.use(
      http.get(`${BASE}${BASE_PATH}/workspaces`, ({ request }) => {
        capturedSearch = new URL(request.url).search;
        return HttpResponse.json(TREE);
      })
    );
    await getWorkspaceTree(client, BASE_PATH);
    expect(capturedSearch).not.toContain('includeShells');
  });

  it('forwards AbortSignal via config', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      getWorkspaceTree(client, BASE_PATH, { signal: controller.signal })
    ).rejects.toThrow();
  });
});

describe('getLandingRoute', () => {
  it('GETs /me/landing-route and returns the response', async () => {
    const result = await getLandingRoute(client, BASE_PATH);
    expect(result).toEqual(LANDING_ROUTE);
  });
});

describe('setPinnedLandingRoute', () => {
  it('PUTs /me/landing-route/pinned and resolves void', async () => {
    await expect(
      setPinnedLandingRoute(client, BASE_PATH, { route: '/w/CRM' })
    ).resolves.toBeUndefined();
  });

  it('accepts route: null to clear the pin', async () => {
    let body: unknown = null;
    server.use(
      http.put(`${BASE}${BASE_PATH}/me/landing-route/pinned`, async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 204 });
      })
    );
    await setPinnedLandingRoute(client, BASE_PATH, { route: null });
    expect(body).toEqual({ route: null });
  });
});
