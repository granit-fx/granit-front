import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GroupBySelector } from '../querying/group-by-selector';
import { renderWithI18n, setupI18n } from './test-utils';

import type { ColumnDefinition, GroupByField } from '@granit/query-engine';

beforeAll(setupI18n);

const fields: GroupByField[] = [
  { name: 'status', type: 'String' },
  { name: 'category', type: 'String' },
];

const columns: ColumnDefinition[] = [
  {
    name: 'status',
    label: 'Status',
    type: 'String',
    order: 0,
    isSortable: true,
    isFilterable: true,
    isVisible: true,
  },
];

describe('GroupBySelector', () => {
  it('renders nothing when there are no group-by fields', () => {
    const { container } = renderWithI18n(<GroupBySelector fields={[]} onValueChange={vi.fn()} />);
    expect(container.querySelector('[data-slot="group-by-selector"]')).toBeNull();
  });

  it('shows the plain label when no value is selected', () => {
    renderWithI18n(<GroupBySelector fields={fields} onValueChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Group by' })).toBeInTheDocument();
  });

  it('resolves the selected value label from columns in the trigger', () => {
    renderWithI18n(
      <GroupBySelector fields={fields} columns={columns} value="status" onValueChange={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /Status/ })).toBeInTheDocument();
  });

  it('falls back to the field name when no column label exists', async () => {
    renderWithI18n(<GroupBySelector fields={fields} onValueChange={vi.fn()} />);
    await userEvent.click(screen.getByRole('button'));
    expect(await screen.findByRole('menuitem', { name: 'category' })).toBeInTheDocument();
  });

  it('invokes onValueChange with the field name when an item is clicked', async () => {
    const onValueChange = vi.fn();
    renderWithI18n(<GroupBySelector fields={fields} columns={columns} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Status' }));
    expect(onValueChange).toHaveBeenCalledWith('status');
  });

  it('offers a "no grouping" item that clears the value', async () => {
    const onValueChange = vi.fn();
    renderWithI18n(
      <GroupBySelector
        fields={fields}
        columns={columns}
        value="status"
        onValueChange={onValueChange}
      />
    );
    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'No grouping' }));
    expect(onValueChange).toHaveBeenCalledWith(undefined);
  });
});
