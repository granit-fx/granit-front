import { fn } from 'storybook/test';

import { WorkspaceDeleteDialog } from './workspace-delete-dialog';

import type { AIWorkspaceResponse } from '@granit/ai';
import type { Meta, StoryObj } from '@storybook/react-vite';

const workspace: AIWorkspaceResponse = {
  name: 'support-bot',
  provider: 'OpenAI',
  model: 'gpt-4o-mini',
  systemPrompt: null,
  temperature: 0.5,
  maxOutputTokens: 2048,
  kind: 'Dynamic',
  activated: true,
  capabilities: null,
};

const meta: Meta<typeof WorkspaceDeleteDialog> = {
  title: 'Features/Ai/WorkspaceDeleteDialog',
  component: WorkspaceDeleteDialog,
  tags: ['autodocs'],
  args: {
    open: true,
    onOpenChange: fn(),
    onConfirm: fn(),
    isPending: false,
    workspace,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Dynamic: Story = {};

export const System: Story = {
  args: {
    workspace: { ...workspace, kind: 'System', name: 'default-chat' },
  },
};

export const Pending: Story = {
  args: {
    isPending: true,
  },
};
