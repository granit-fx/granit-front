import { Table, TableBody, TableCell, TableRow } from '@granit/react-ui';
import { fn } from 'storybook/test';

import { GroupByRows } from './group-by-rows';

import type { GroupEntry } from '@granit/query-engine';
import type { Meta, StoryObj } from '@storybook/react-vite';

interface Patient {
  readonly id: string;
  readonly name: string;
}

const groups: GroupEntry<Patient>[] = [
  {
    field: 'status',
    value: 'active',
    label: 'Active',
    count: 2,
    items: [
      { id: 'p-1', name: 'Ada Lovelace' },
      { id: 'p-2', name: 'Grace Hopper' },
    ],
  },
  {
    field: 'status',
    value: 'inactive',
    label: 'Inactive',
    count: 1,
    items: [{ id: 'p-3', name: 'Alan Turing' }],
  },
];

const renderItem = (patient: Patient, index: number) => (
  <TableRow key={patient.id} data-index={index}>
    <TableCell className="pl-10">{patient.name}</TableCell>
  </TableRow>
);

const meta = {
  title: 'Admin Kit/Querying/GroupByRows',
  // Instantiated with `Patient` so `renderItem` resolves to a single
  // `(item: Patient, …)` signature; the bare generic resolves to an
  // intersection with `(item: unknown, …)`, which no concrete renderer matches.
  component: GroupByRows<Patient>,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="w-96 rounded-md border">
        <Table>
          <TableBody>
            <Story />
          </TableBody>
        </Table>
      </div>
    ),
  ],
  args: {
    colSpan: 1,
    onExpand: fn(),
  },
} satisfies Meta<typeof GroupByRows<Patient>>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Collapsed group rows — click a row to expand and reveal its items. */
export const Default: Story = {
  args: {
    groups,
    renderItem,
  },
};

/** Group headers without an item renderer (count-only summary rows). */
export const WithoutItemRenderer: Story = {
  args: {
    groups,
  },
};

/** No groups — nothing is rendered. */
export const Empty: Story = {
  args: {
    groups: [],
    renderItem,
  },
};
