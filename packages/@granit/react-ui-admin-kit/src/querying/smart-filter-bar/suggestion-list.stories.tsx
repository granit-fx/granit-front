import { Command } from 'cmdk';
import { fn } from 'storybook/test';

import { SuggestionList } from './suggestion-list';

import type { FilterSuggestion } from '@granit/query-engine';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Admin Kit/SuggestionList',
  component: SuggestionList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="w-80 rounded-md border bg-popover shadow-md">
        <Command>
          <Story />
        </Command>
      </div>
    ),
  ],
  args: {
    onSelect: fn(),
  },
} satisfies Meta<typeof SuggestionList>;

export default meta;
type Story = StoryObj<typeof meta>;

const fieldSuggestions: FilterSuggestion[] = [
  {
    id: 'field-name',
    type: 'filter',
    label: 'Name',
    description: 'Filter by name',
    field: 'name',
  },
  {
    id: 'field-status',
    type: 'filter',
    label: 'Status',
    description: 'Filter by status',
    field: 'status',
  },
  {
    id: 'field-created-at',
    type: 'filter',
    label: 'Created At',
    description: 'Filter by creation date',
    field: 'createdAt',
  },
];

const valueSuggestions: FilterSuggestion[] = [
  {
    id: 'status-active',
    type: 'filter',
    label: 'Active',
    value: 'active',
    selected: true,
  },
  {
    id: 'status-inactive',
    type: 'filter',
    label: 'Inactive',
    value: 'inactive',
    selected: false,
  },
  {
    id: 'status-pending',
    type: 'filter',
    label: 'Pending',
    value: 'pending',
    selected: false,
  },
];

const searchSuggestions: FilterSuggestion[] = [
  {
    id: 'search-name-john',
    type: 'search',
    label: 'Name',
    field: 'name',
    searchValue: 'john',
  },
  {
    id: 'search-email-john',
    type: 'search',
    label: 'Email',
    field: 'email',
    searchValue: 'john',
  },
];

const presetSuggestions: FilterSuggestion[] = [
  {
    id: 'preset-recent',
    type: 'preset',
    label: 'Recent items',
    description: 'Last 30 days',
    name: 'recent',
    group: 'Time',
  },
  {
    id: 'preset-mine',
    type: 'preset',
    label: 'My items',
    description: 'Assigned to me',
    name: 'mine',
    group: 'Ownership',
  },
];

export const Default: Story = {
  args: {
    suggestions: fieldSuggestions,
  },
};

export const ValueSuggestionsWithSelection: Story = {
  args: {
    suggestions: valueSuggestions,
  },
};

export const SearchSuggestions: Story = {
  args: {
    suggestions: searchSuggestions,
  },
};

export const PresetSuggestions: Story = {
  args: {
    suggestions: presetSuggestions,
  },
};

export const Empty: Story = {
  args: {
    suggestions: [],
  },
};
