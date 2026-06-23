import { createApiClient } from '@granit/api-client';
import { createWorkflowHandlers } from '@granit/react-workflow/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';

import { EntityWorkflow } from './entity-workflow';
import { storyI18n } from './stories-i18n';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const config = { client, basePath: '/api/v1/workflow' };
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof EntityWorkflow> = {
  title: 'Workflow/EntityWorkflow',
  component: EntityWorkflow,
  tags: ['autodocs', '!test'],
  args: { config },
  parameters: {
    layout: 'padded',
    msw: { handlers: createWorkflowHandlers() },
  },
  argTypes: {
    entityType: { control: 'text' },
    entityId: { control: 'text' },
    states: { control: 'object' },
  },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entityType: 'User',
    entityId: 'user-001',
    currentState: 'Active',
    states: ['PendingValidation', 'Active', 'Suspended', 'Archived'],
  },
};

export const FewStates: Story = {
  args: {
    entityType: 'User',
    entityId: 'user-001',
    currentState: 'Draft',
    states: ['Draft', 'Active', 'Closed'],
  },
};
