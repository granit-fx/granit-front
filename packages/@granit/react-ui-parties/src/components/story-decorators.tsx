import { createApiClient } from '@granit/api-client';
import { PartiesProvider } from '@granit/react-parties';
import { createPartiesHandlers } from '@granit/react-parties/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import type { Decorator } from '@storybook/react-vite';

// Shared story scaffolding for the parties admin components. Components that read
// the flat `translation` namespace (tabs, dialogs, tax-status card) resolve their
// strings against the Storybook root i18n instance (auto-registered bundle), so
// only the data layer (Axios client, QueryClient, PartiesProvider) and a router
// need wiring here.

const client = createApiClient({ baseURL: '' });

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

/** Wrap a story with a PartiesProvider, QueryClient and router. */
export const withPartiesProvider: Decorator = (Story) => (
  <QueryClientProvider client={makeQueryClient()}>
    <MemoryRouter>
      <PartiesProvider config={{ client, basePath: '/api/v1/parties' }}>
        <Story />
      </PartiesProvider>
    </MemoryRouter>
  </QueryClientProvider>
);

/** Stateful MSW handlers for the parties admin endpoints. */
export const partiesMswParameters = { msw: { handlers: createPartiesHandlers() } };
