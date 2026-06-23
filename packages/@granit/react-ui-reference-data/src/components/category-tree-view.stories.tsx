import { createApiClient } from '@granit/api-client';
import { toEntityId } from '@granit/types';
import { fn } from 'storybook/test';

import { CategoryTreeView } from './category-tree-view';

import type { ReferenceDataEntry } from './types';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { UseQueryResult } from '@tanstack/react-query';

const api = createApiClient({ baseURL: '' });

function makeEntry(code: string, labelEn: string, activated = true): ReferenceDataEntry {
  return {
    id: toEntityId(code),
    code,
    label: labelEn,
    labelEn,
    labelFr: labelEn,
    labelNl: labelEn,
    labelDe: labelEn,
    labelEs: labelEn,
    labelIt: labelEn,
    labelPt: labelEn,
    labelZh: labelEn,
    labelJa: labelEn,
    labelPl: labelEn,
    labelTr: labelEn,
    labelKo: labelEn,
    labelSv: labelEn,
    labelCs: labelEn,
    activated,
    sortOrder: 0,
    validFrom: null,
    validTo: null,
    parentCode: null,
    metadata: null,
  };
}

const roots: ReferenceDataEntry[] = [
  makeEntry('ELECTRONICS', 'Electronics'),
  makeEntry('CLOTHING', 'Clothing'),
  makeEntry('LEGACY', 'Legacy category', false),
];

// Stub the children hook so the tree renders without a live API.
const useChildren = (() =>
  ({ data: [], isLoading: false }) as unknown as UseQueryResult<ReferenceDataEntry[]>) as never;

const meta: Meta<typeof CategoryTreeView> = {
  title: 'Features/ReferenceData/CategoryTreeView',
  component: CategoryTreeView,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="w-96 rounded-md border p-2">
        <Story />
      </div>
    ),
  ],
  args: {
    roots,
    useChildren,
    apiClient: api,
    onSelect: fn(),
    i18nPrefix: 'ProductCategories',
  },
};

export default meta;
type Story = StoryObj<typeof CategoryTreeView>;

export const Default: Story = {};

export const Loading: Story = {
  args: { isLoading: true },
};

export const Empty: Story = {
  args: { roots: [] },
};
