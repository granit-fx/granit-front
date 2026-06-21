import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BulkActions, type BulkAction } from '../querying/bulk-actions';

import { renderWithI18n, setupI18n } from './test-utils';

beforeAll(setupI18n);

const deleteAction: BulkAction = {
  id: 'delete',
  label: 'Delete',
  variant: 'destructive',
  onAction: () => undefined,
};

describe('BulkActions', () => {
  it('renders nothing when no items are selected', () => {
    const { container } = renderWithI18n(
      <BulkActions
        totalCount={10}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        visibleIds={['a', 'b']}
        actions={[deleteAction]}
      />
    );
    expect(container.querySelector('[data-slot="bulk-actions"]')).toBeNull();
  });

  it('renders the toolbar and action buttons when items are selected', () => {
    renderWithI18n(
      <BulkActions
        totalCount={10}
        selectedIds={['a']}
        onSelectionChange={vi.fn()}
        visibleIds={['a', 'b']}
        actions={[deleteAction]}
      />
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByText('Components.Querying.BulkActions.SelectedCount')).toBeInTheDocument();
  });

  it('invokes the action callback with the selected ids', async () => {
    const onAction = vi.fn();
    renderWithI18n(
      <BulkActions
        totalCount={10}
        selectedIds={['a', 'c']}
        onSelectionChange={vi.fn()}
        visibleIds={['a', 'b']}
        actions={[{ ...deleteAction, onAction }]}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onAction).toHaveBeenCalledWith(['a', 'c']);
  });

  it('selects all visible ids when the checkbox is checked', async () => {
    const onSelectionChange = vi.fn();
    renderWithI18n(
      <BulkActions
        totalCount={10}
        selectedIds={['a']}
        onSelectionChange={onSelectionChange}
        visibleIds={['a', 'b']}
        actions={[deleteAction]}
      />
    );
    // 'a' selected but 'b' not -> checkbox is unchecked, clicking selects all.
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(new Set(onSelectionChange.mock.calls[0][0])).toEqual(new Set(['a', 'b']));
  });

  it('deselects visible ids when the checkbox is unchecked', async () => {
    const onSelectionChange = vi.fn();
    renderWithI18n(
      <BulkActions
        totalCount={10}
        selectedIds={['a', 'b', 'z']}
        onSelectionChange={onSelectionChange}
        visibleIds={['a', 'b']}
        actions={[deleteAction]}
      />
    );
    // all visible selected -> checkbox checked, clicking removes visible ids.
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onSelectionChange).toHaveBeenCalledWith(['z']);
  });
});
