import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { createAuditHandlers } from '@granit/react-auditing/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

import { AuditListPage } from './audit-list-page';
import { DEFAULT_AUDIT_BASE_PATH } from './constants';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});
const client = createApiClient({ baseURL: '' });

const meta: Meta<typeof AuditListPage> = {
  title: 'Auditing/AuditListPage',
  component: AuditListPage,
  tags: ['autodocs'],
  parameters: {
    // Server-driven grid (QueryEndpointDataTable); MSW serves the audit-entries
    // list + `/meta` the hooks call.
    msw: { handlers: createAuditHandlers(DEFAULT_AUDIT_BASE_PATH) },
  },
  decorators: [
    (Story) => (
      <GranitClientProvider client={client}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/auditing']}>
            <Story />
          </MemoryRouter>
        </QueryClientProvider>
      </GranitClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Audit log list — server-driven grid with a category filter. */
export const Default: Story = {};
