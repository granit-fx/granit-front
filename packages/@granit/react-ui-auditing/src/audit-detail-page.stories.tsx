import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { createAuditHandlers, mockAuditEntries } from '@granit/react-auditing/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AuditDetailPage } from './audit-detail-page';
import { DEFAULT_AUDIT_BASE_PATH } from './constants';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});
const client = createApiClient({ baseURL: '' });
const sampleId = mockAuditEntries[0]!.id;

const meta: Meta<typeof AuditDetailPage> = {
  title: 'Auditing/AuditDetailPage',
  component: AuditDetailPage,
  tags: ['autodocs'],
  parameters: {
    // MSW serves `GET /audit-entries/:id` (full detail with entity changes).
    msw: { handlers: createAuditHandlers(DEFAULT_AUDIT_BASE_PATH) },
  },
  decorators: [
    (Story) => (
      <GranitClientProvider client={client}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[`/auditing/${sampleId}`]}>
            <Routes>
              <Route path="/auditing/:id" element={<Story />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </GranitClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Audit entry detail — metadata card + nested entity/property changes. */
export const Default: Story = {};
