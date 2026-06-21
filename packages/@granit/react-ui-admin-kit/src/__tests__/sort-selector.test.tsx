import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SortSelector } from '../querying/sort-selector';
import { renderWithI18n, setupI18n } from './test-utils';

import type { ColumnDefinition, SortEntry } from '@granit/query-engine';

beforeAll(setupI18n);

const baseColumn = {
  type: 'String',
  isFilterable: true,
  isVisible: true,
} as const;

const columns: ColumnDefinition[] = [
  { name: 'firstName', label: 'First name', order: 0, isSortable: true, ...baseColumn },
  { name: 'lastName', label: 'Last name', order: 1, isSortable: true, ...baseColumn },
  { name: 'internal', label: 'Internal', order: 2, isSortable: false, ...baseColumn },
];

describe('SortSelector', () => {
  it('renders nothing when there are no sortable columns', () => {
    const { container } = renderWithI18n(
      <SortSelector
        columns={[{ name: 'internal', label: 'Internal', order: 0, isSortable: false, ...baseColumn }]}
        onToggleSort={vi.fn()}
      />
    );
    expect(container.querySelector('[data-slot="sort-selector"]')).toBeNull();
  });

  it('shows the plain label when no sort is active', () => {
    renderWithI18n(<SortSelector columns={columns} onToggleSort={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Sort' })).toBeInTheDocument();
  });

  it('reflects the current sort field in the trigger label', () => {
    const sort: SortEntry[] = [{ field: 'lastName', direction: 'asc' }];
    renderWithI18n(<SortSelector columns={columns} sort={sort} onToggleSort={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Last name/ })).toBeInTheDocument();
  });

  it('lists only sortable columns when opened', async () => {
    renderWithI18n(<SortSelector columns={columns} onToggleSort={vi.fn()} />);
    await userEvent.click(screen.getByRole('button'));
    const items = await screen.findAllByRole('menuitem');
    expect(items).toHaveLength(2);
    expect(screen.queryByRole('menuitem', { name: 'Internal' })).toBeNull();
  });

  it('invokes onToggleSort with the field name when an item is clicked', async () => {
    const onToggleSort = vi.fn();
    renderWithI18n(<SortSelector columns={columns} onToggleSort={onToggleSort} />);
    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'First name' }));
    expect(onToggleSort).toHaveBeenCalledWith('firstName');
  });
});
