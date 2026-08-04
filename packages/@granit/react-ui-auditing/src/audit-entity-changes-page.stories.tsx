import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { createAuditEntityChangesHandlers } from '@granit/react-auditing/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

import { AuditEntityChangesPage } from './audit-entity-changes-page';
import { DEFAULT_AUDIT_BASE_PATH } from './constants';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});
const client = createApiClient({ baseURL: '' });

const meta: Meta<typeof AuditEntityChangesPage> = {
  title: 'Auditing/AuditEntityChangesPage',
  component: AuditEntityChangesPage,
  tags: ['autodocs'],
  parameters: {
    // Server-driven grid over the cross-cutting audit-entity-changes endpoint;
    // MSW serves the list + `/meta` the hooks call.
    msw: { handlers: createAuditEntityChangesHandlers(DEFAULT_AUDIT_BASE_PATH) },
  },
  decorators: [
    (Story) => (
      <GranitClientProvider client={client}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/auditing/entity-changes']}>
            <Story />
          </MemoryRouter>
        </QueryClientProvider>
      </GranitClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Cross-cutting entity-changes grid — filter by entity type and change type. */
export const Default: Story = {};
