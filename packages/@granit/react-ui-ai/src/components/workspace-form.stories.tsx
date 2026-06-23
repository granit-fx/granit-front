import { createApiClient } from '@granit/api-client';
import { AIProvider } from '@granit/react-ai';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { WorkspaceForm } from './workspace-form';

import type { AIConfig } from '@granit/react-ai';
import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });
const aiConfig: AIConfig = { client, basePath: '/api/v1/ai' };

const meta: Meta<typeof WorkspaceForm> = {
  title: 'Features/Ai/WorkspaceForm',
  component: WorkspaceForm,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    onSubmit: fn(),
    onCancel: fn(),
    isPending: false,
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <AIProvider config={aiConfig}>
          <div className="max-w-2xl">
            <Story />
          </div>
        </AIProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  args: {
    mode: 'create',
  },
};

export const Edit: Story = {
  args: {
    mode: 'edit',
    defaultValues: {
      provider: 'OpenAI',
      model: 'gpt-4o',
      systemPrompt: 'You are a helpful assistant.',
      temperature: '0.7',
      maxOutputTokens: '4096',
      activated: true,
    },
  },
};
