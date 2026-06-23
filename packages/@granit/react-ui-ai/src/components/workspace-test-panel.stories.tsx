import { createApiClient } from '@granit/api-client';
import { AIProvider } from '@granit/react-ai';
import { AuthorizationProvider } from '@granit/react-authorization';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { WorkspaceTestPanel } from './workspace-test-panel';

import type { AIWorkspaceResponse } from '@granit/ai';
import type { AIConfig } from '@granit/react-ai';
import type { AuthorizationConfig } from '@granit/react-authorization';
import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });
const aiConfig: AIConfig = { client, basePath: '/api/v1/ai' };
const authorizationConfig: AuthorizationConfig = {
  client,
  basePath: '/api/v1/authorization',
};

const workspace: AIWorkspaceResponse = {
  name: 'default-chat',
  provider: 'OpenAI',
  model: 'gpt-4o',
  systemPrompt: null,
  temperature: 0.7,
  maxOutputTokens: 4096,
  kind: 'System',
  activated: true,
  capabilities: {
    chat: true,
    embeddings: true,
    vision: false,
    imageGeneration: false,
    audio: false,
    toolUse: false,
    streaming: true,
    structuredOutput: false,
    extensions: [],
  },
};

const meta: Meta<typeof WorkspaceTestPanel> = {
  title: 'Features/Ai/WorkspaceTestPanel',
  component: WorkspaceTestPanel,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <AuthorizationProvider config={authorizationConfig}>
          <AIProvider config={aiConfig}>
            <div className="max-w-2xl">
              <Story />
            </div>
          </AIProvider>
        </AuthorizationProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { workspace },
};
