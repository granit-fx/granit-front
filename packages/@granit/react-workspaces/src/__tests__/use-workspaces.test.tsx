import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useWorkspaces, workspaceTreeQueryKey } from '../api/use-workspaces.js';

import type { WorkspaceTreeResponse } from '@granit/workspaces';
import type { ReactNode } from 'react';

const TREE: WorkspaceTreeResponse = {
  schemaVersion: 1,
  workspaces: [
    {
      name: 'Granit.Showcase.CRM',
      displayKey: 'Granit.Showcase.CRM.DisplayName',
      icon: 'briefcase',
      order: 100,
      isShell: false,
      sections: [
        {
          key: 'parties',
          displayKey: 'Granit.Showcase.CRM.Parties',
          order: 0,
          collapsedByDefault: false,
          items: [
            {
              kind: 'Entity',
              order: 0,
              displayKey: null,
              icon: null,
              entityName: 'Granit.Parties.Party',
              entityViewName: null,
              entityPresetOverlay: null,
              dashboardName: null,
              linkUrl: null,
              subWorkspaceName: null,
            },
          ],
        },
      ],
    },
  ],
};

let getCalls = 0;

function freshHandlers() {
  return [
    http.get('http://localhost/api/v1/workspaces', () => {
      getCalls += 1;
      return HttpResponse.json(TREE);
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
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={apiClient}>{children}</GranitClientProvider>
    </QueryClientProvider>
  );
  return { wrapper, queryClient };
}

describe('useWorkspaces', () => {
  it('returns the workspace tree on success', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useWorkspaces(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(TREE);
    expect(getCalls).toBe(1);
  });

  it('honours enabled: false', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useWorkspaces({ enabled: false }), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(getCalls).toBe(0);
  });

  it('caches under the tree query key', async () => {
    const { wrapper, queryClient } = makeWrapper();
    const { result } = renderHook(() => useWorkspaces(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(workspaceTreeQueryKey())).toEqual(TREE);
  });

  it('surfaces the error when the endpoint returns 500', async () => {
    server.use(
      http.get('http://localhost/api/v1/workspaces', () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 })
      )
    );
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useWorkspaces(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
