import { Badge } from '@granit/react-ui';
import { fn } from 'storybook/test';

import { WorkspaceTable } from './workspace-table';

import type { AIWorkspaceResponse } from '@granit/ai';
import type { DataTableColumnDef } from '@granit/react-ui-kit';
import type { Meta, StoryObj } from '@storybook/react-vite';

const workspaces: AIWorkspaceResponse[] = [
  {
    name: 'default-chat',
    provider: 'OpenAI',
    model: 'gpt-4o',
    systemPrompt: null,
    temperature: 0.7,
    maxOutputTokens: 4096,
    kind: 'System',
    activated: true,
    capabilities: null,
  },
  {
    name: 'support-bot',
    provider: 'Anthropic',
    model: 'claude-3-5-sonnet',
    systemPrompt: null,
    temperature: 0.4,
    maxOutputTokens: 2048,
    kind: 'Dynamic',
    activated: false,
    capabilities: null,
  },
];

const columns: DataTableColumnDef<AIWorkspaceResponse, unknown>[] = [
  { id: 'name', accessorKey: 'name', header: 'Key' },
  { id: 'provider', accessorKey: 'provider', header: 'Provider' },
  { id: 'model', accessorKey: 'model', header: 'Model' },
  {
    id: 'activated',
    accessorKey: 'activated',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.activated ? 'default' : 'secondary'}>
        {row.original.activated ? 'Enabled' : 'Disabled'}
      </Badge>
    ),
  },
];

const meta: Meta<typeof WorkspaceTable> = {
  title: 'Features/Ai/WorkspaceTable',
  component: WorkspaceTable,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    data: workspaces,
    columns,
    onRowClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    data: [],
  },
};
