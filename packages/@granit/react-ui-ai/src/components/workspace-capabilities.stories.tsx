import { WorkspaceCapabilities } from './workspace-capabilities';

import type { AIModelCapabilities } from '@granit/ai';
import type { Meta, StoryObj } from '@storybook/react-vite';

const fullCapabilities: AIModelCapabilities = {
  chat: true,
  embeddings: true,
  vision: true,
  imageGeneration: false,
  audio: false,
  toolUse: true,
  streaming: true,
  structuredOutput: true,
  extensions: ['web-search', 'code-interpreter'],
};

const meta: Meta<typeof WorkspaceCapabilities> = {
  title: 'Features/Ai/WorkspaceCapabilities',
  component: WorkspaceCapabilities,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const FullSupport: Story = {
  args: {
    capabilities: fullCapabilities,
  },
};

export const ChatOnly: Story = {
  args: {
    capabilities: {
      chat: true,
      embeddings: false,
      vision: false,
      imageGeneration: false,
      audio: false,
      toolUse: false,
      streaming: true,
      structuredOutput: false,
      extensions: [],
    },
  },
};

export const Empty: Story = {
  args: {
    capabilities: null,
  },
};
