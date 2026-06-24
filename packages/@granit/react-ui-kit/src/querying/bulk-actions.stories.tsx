import { Trash2Icon } from 'lucide-react';
import { fn } from 'storybook/test';

import { BulkActions } from './bulk-actions';

import type { BulkAction } from './bulk-actions';
import type { Meta, StoryObj } from '@storybook/react-vite';

const visibleIds = ['1', '2', '3', '4', '5'];

const actions: BulkAction[] = [
  {
    id: 'delete',
    label: 'Delete',
    variant: 'destructive',
    icon: <Trash2Icon className="size-4" />,
    onAction: fn(),
  },
  {
    id: 'export',
    label: 'Export',
    variant: 'outline',
    onAction: fn(),
  },
];

const meta = {
  title: 'Admin Kit/Querying/BulkActions',
  component: BulkActions,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    totalCount: 100,
    visibleIds,
    actions,
    onSelectionChange: fn(),
  },
} satisfies Meta<typeof BulkActions>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Some rows selected — toolbar appears with selection count and actions. */
export const SomeSelected: Story = {
  args: {
    selectedIds: ['1', '2'],
  },
};

/** Every visible row selected — the "select all visible" checkbox is checked. */
export const AllVisibleSelected: Story = {
  args: {
    selectedIds: visibleIds,
  },
};

/** A single bulk action. */
export const SingleAction: Story = {
  args: {
    selectedIds: ['1'],
    actions: [actions[0]!],
  },
};

/** No selection — the component renders nothing (returns null). */
export const Empty: Story = {
  args: {
    selectedIds: [],
  },
};
