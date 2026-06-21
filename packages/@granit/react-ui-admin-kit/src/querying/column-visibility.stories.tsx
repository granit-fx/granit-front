import { fn } from 'storybook/test';

import { ColumnVisibility } from './column-visibility';

import type { ColumnDefinition } from '@granit/query-engine';
import type { Meta, StoryObj } from '@storybook/react-vite';

const sampleColumns: ColumnDefinition[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'String',
    order: 0,
    isSortable: true,
    isFilterable: true,
    isVisible: true,
  },
  {
    name: 'email',
    label: 'Email',
    type: 'String',
    order: 1,
    isSortable: true,
    isFilterable: true,
    isVisible: true,
  },
  {
    name: 'createdAt',
    label: 'Created At',
    type: 'DateTime',
    order: 2,
    isSortable: true,
    isFilterable: true,
    isVisible: true,
  },
  {
    name: 'status',
    label: 'Status',
    type: 'String',
    order: 3,
    isSortable: false,
    isFilterable: true,
    isVisible: false,
  },
  {
    name: 'role',
    label: 'Role',
    type: 'String',
    order: 4,
    isSortable: false,
    isFilterable: true,
    isVisible: false,
  },
];

const meta = {
  title: 'Admin Kit/ColumnVisibility',
  component: ColumnVisibility,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    columns: sampleColumns,
    onVisibilityChange: fn(),
  },
} satisfies Meta<typeof ColumnVisibility>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    visibleColumns: ['name', 'email', 'createdAt'],
  },
};

export const AllVisible: Story = {
  args: {
    visibleColumns: ['name', 'email', 'createdAt', 'status', 'role'],
  },
};

export const AllHidden: Story = {
  args: {
    visibleColumns: [],
  },
};

export const SingleColumn: Story = {
  args: {
    columns: [
      {
        name: 'id',
        label: 'ID',
        type: 'Int32',
        order: 0,
        isSortable: true,
        isFilterable: false,
        isVisible: true,
      },
    ],
    visibleColumns: ['id'],
  },
};
