import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ColumnVisibility } from '../querying/column-visibility';

import { renderWithI18n, setupI18n } from './test-utils';

import type { ColumnDefinition } from '@granit/query-engine';

beforeAll(setupI18n);

const columns: ColumnDefinition[] = [
  {
    name: 'firstName',
    label: 'First name',
    type: 'String',
    order: 0,
    isSortable: true,
    isFilterable: true,
    isVisible: true,
  },
  {
    name: 'lastName',
    label: 'Last name',
    type: 'String',
    order: 1,
    isSortable: true,
    isFilterable: true,
    isVisible: true,
  },
];

describe('ColumnVisibility', () => {
  it('renders the trigger button', () => {
    renderWithI18n(
      <ColumnVisibility
        columns={columns}
        visibleColumns={['firstName']}
        onVisibilityChange={vi.fn()}
      />
    );
    expect(screen.getByText('Components.Querying.Columns.Label')).toBeInTheDocument();
  });

  it('lists every column with its visibility state when opened', async () => {
    renderWithI18n(
      <ColumnVisibility
        columns={columns}
        visibleColumns={['firstName']}
        onVisibilityChange={vi.fn()}
      />
    );
    await userEvent.click(screen.getByText('Components.Querying.Columns.Label'));

    const items = await screen.findAllByRole('menuitemcheckbox');
    expect(items).toHaveLength(2);
    const firstName = items.find((i) => i.textContent === 'First name');
    const lastName = items.find((i) => i.textContent === 'Last name');
    expect(firstName).toHaveAttribute('aria-checked', 'true');
    expect(lastName).toHaveAttribute('aria-checked', 'false');
  });

  it('adds a column to visibleColumns when an unchecked item is toggled', async () => {
    const onVisibilityChange = vi.fn();
    renderWithI18n(
      <ColumnVisibility
        columns={columns}
        visibleColumns={['firstName']}
        onVisibilityChange={onVisibilityChange}
      />
    );
    await userEvent.click(screen.getByText('Components.Querying.Columns.Label'));
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Last name' }));
    expect(onVisibilityChange).toHaveBeenCalledWith(['firstName', 'lastName']);
  });

  it('removes a column from visibleColumns when a checked item is toggled', async () => {
    const onVisibilityChange = vi.fn();
    renderWithI18n(
      <ColumnVisibility
        columns={columns}
        visibleColumns={['firstName', 'lastName']}
        onVisibilityChange={onVisibilityChange}
      />
    );
    await userEvent.click(screen.getByText('Components.Querying.Columns.Label'));
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'First name' }));
    expect(onVisibilityChange).toHaveBeenCalledWith(['lastName']);
  });
});
