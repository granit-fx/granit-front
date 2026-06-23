import { WorkspaceDetail } from './workspace-detail';

import type { AIWorkspaceResponse } from '@granit/ai';
import type { Meta, StoryObj } from '@storybook/react-vite';

const workspace: AIWorkspaceResponse = {
  key: 'default-chat',
  provider: 'OpenAI',
  model: 'gpt-4o',
  systemPrompt: 'You are a helpful assistant for the Granit platform.',
  temperature: 0.7,
  maxOutputTokens: 4096,
  kind: 'System',
  activated: true,
  capabilities: {
    chat: true,
    embeddings: false,
    vision: true,
    imageGeneration: false,
    audio: false,
    toolUse: true,
    streaming: true,
    structuredOutput: true,
    extensions: ['web-search'],
  },
};

const meta: Meta<typeof WorkspaceDetail> = {
  title: 'Features/Ai/WorkspaceDetail',
  component: WorkspaceDetail,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { workspace },
};

export const MinimalConfiguration: Story = {
  args: {
    workspace: {
      ...workspace,
      systemPrompt: null,
      temperature: null,
      maxOutputTokens: null,
      capabilities: null,
    },
  },
};
