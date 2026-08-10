import { useSmartFilter } from '@granit/react-query-engine';

import { SmartFilterBar } from './smart-filter-bar';

import type { QueryMetadata } from '@granit/query-engine';
import type { Meta, StoryObj } from '@storybook/react-vite';

const META: QueryMetadata = {
  columns: [
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
      name: 'status',
      label: 'Status',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'createdAt',
      label: 'Created',
      type: 'DateTimeOffset',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'name', type: 'String', operators: ['Contains', 'Eq'] },
    {
      name: 'status',
      type: 'String',
      operators: ['Eq', 'In'],
      enumValues: ['Active', 'Inactive', 'Pending'],
    },
    { name: 'createdAt', type: 'DateTimeOffset', operators: ['Gte', 'Lte'] },
  ],
  sortableFields: [{ name: 'name' }, { name: 'status' }, { name: 'createdAt' }],
  presetFilterGroups: [
    {
      name: 'status',
      label: 'Status',
      presets: [
        { name: 'active', label: 'Active', isDefault: true },
        { name: 'inactive', label: 'Inactive', isDefault: false },
      ],
    },
  ],
  quickFilters: [{ name: 'recent', label: 'Recent', isDefault: false }],
  dateFilters: [],
  groupByFields: [],
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
};

function Harness({ metadata }: { readonly metadata?: QueryMetadata }) {
  const smartFilter = useSmartFilter({ metadata });
  return <SmartFilterBar smartFilter={smartFilter} placeholder="Search or filter…" />;
}

// The stories render `Harness`, not `SmartFilterBar` directly: the bar needs a
// live `useSmartFilter` return, which cannot be expressed as a static arg. The
// harness takes only an optional `metadata`, so the render-only stories below
// need no `args`.
const meta = {
  title: 'Admin Kit/Querying/SmartFilterBar',
  component: Harness,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="w-[42rem]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Harness>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Idle omnibox — focus the input to surface field/preset/quick-filter suggestions. */
export const Default: Story = {
  render: () => <Harness metadata={META} />,
};

/** No metadata yet (still loading) — the bar renders an empty input. */
export const NoMetadata: Story = {
  render: () => <Harness metadata={undefined} />,
};
