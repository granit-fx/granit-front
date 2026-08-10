import { fn } from 'storybook/test';

import { FacetBadge } from './facet-badge';

import type { FilterToken } from '@granit/query-engine';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Admin Kit/FacetBadge',
  component: FacetBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    onRemove: fn(),
  },
} satisfies Meta<typeof FacetBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

const filterToken: FilterToken = {
  id: 'filter-status-active',
  type: 'filter',
  label: 'Status = Active',
  field: 'status',
  operator: 'Eq',
  value: 'active',
  labelParts: {
    field: 'Status',
    operator: '=',
    value: 'Active',
  },
};

const filterTokenSimple: FilterToken = {
  id: 'filter-name-john',
  type: 'filter',
  label: 'Name contains John',
  field: 'name',
  operator: 'Contains',
  value: 'John',
  labelParts: {
    field: 'Name',
    operator: 'contains',
    value: 'John',
  },
};

const presetToken: FilterToken = {
  id: 'preset-active-users',
  type: 'preset',
  label: 'Active Users',
  group: 'Users',
  name: 'active-users',
};

const quickFilterToken: FilterToken = {
  id: 'quick-recent',
  type: 'quickFilter',
  label: 'Recent',
  name: 'recent',
};

const searchToken: FilterToken = {
  id: 'search-john',
  type: 'search',
  label: 'john',
};

export const Default: Story = {
  args: {
    token: filterToken,
  },
};

export const FilterWithLabelParts: Story = {
  args: {
    token: filterTokenSimple,
  },
};

export const Preset: Story = {
  args: {
    token: presetToken,
  },
};

export const QuickFilter: Story = {
  args: {
    token: quickFilterToken,
  },
};

export const Search: Story = {
  args: {
    token: searchToken,
  },
};

export const MultipleBadges: Story = {
  args: {
    token: filterToken,
  },
  render: ({ onRemove }) => (
    <div className="flex flex-wrap gap-2">
      <FacetBadge token={filterToken} onRemove={onRemove} />
      <FacetBadge token={filterTokenSimple} onRemove={onRemove} />
      <FacetBadge token={presetToken} onRemove={onRemove} />
      <FacetBadge token={quickFilterToken} onRemove={onRemove} />
      <FacetBadge token={searchToken} onRemove={onRemove} />
    </div>
  ),
};
