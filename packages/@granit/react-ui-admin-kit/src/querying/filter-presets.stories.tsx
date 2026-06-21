import { fn } from 'storybook/test';

import { FilterPresets } from './filter-presets';

import type { FilterGroupMeta } from '@granit/query-engine';
import type { Meta, StoryObj } from '@storybook/react-vite';

const groups: FilterGroupMeta[] = [
  {
    name: 'status',
    label: 'Status',
    presets: [
      { name: 'active', label: 'Active', isDefault: true },
      { name: 'inactive', label: 'Inactive', isDefault: false },
      { name: 'archived', label: 'Archived', isDefault: false },
    ],
  },
  {
    name: 'ownership',
    label: 'Ownership',
    presets: [
      { name: 'mine', label: 'My items', isDefault: false },
      { name: 'team', label: 'My team', isDefault: false },
    ],
  },
];

const meta = {
  title: 'Admin Kit/Querying/FilterPresets',
  component: FilterPresets,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    groups,
    onToggle: fn(),
  },
} satisfies Meta<typeof FilterPresets>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No preset active in any group. */
export const Default: Story = {
  args: {
    activePresets: {},
  },
};

/** One preset active per group (AND between groups). */
export const WithActivePresets: Story = {
  args: {
    activePresets: { status: ['active'], ownership: ['mine'] },
  },
};

/** A single group of presets. */
export const SingleGroup: Story = {
  args: {
    groups: [groups[0]!],
    activePresets: { status: ['archived'] },
  },
};

/** No groups — the component renders nothing (returns null). */
export const Empty: Story = {
  args: {
    groups: [],
    activePresets: {},
  },
};
