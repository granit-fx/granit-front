import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SortableList, reorderIds } from '../sortable-list.js';

describe('reorderIds', () => {
  it('moves an item from its old position to the target position', () => {
    expect(reorderIds(['a', 'b', 'c'], 'a', 'c')).toEqual(['b', 'c', 'a']);
    expect(reorderIds(['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'a', 'b']);
  });

  it('returns an unchanged copy when either id is absent', () => {
    expect(reorderIds(['a', 'b'], 'a', 'z')).toEqual(['a', 'b']);
    expect(reorderIds(['a', 'b'], 'z', 'b')).toEqual(['a', 'b']);
  });
});

describe('SortableList', () => {
  const items = [
    { id: 'Amount', label: 'Amount' },
    { id: 'Name', label: 'Name' },
  ];

  it('renders nothing when there are no items', () => {
    const { container } = render(<SortableList items={[]} onReorder={vi.fn()} />);
    expect(container.querySelector('[data-slot="sortable-list"]')).toBeNull();
  });

  it('renders one row per item in order, each with a drag handle', () => {
    render(<SortableList items={items} onReorder={vi.fn()} />);
    const rows = screen.getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual(['Amount', 'Name']);
    expect(screen.getAllByRole('button', { name: 'Reorder' })).toHaveLength(2);
  });

  it('invokes onRemove with the row id when its remove button is clicked', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<SortableList items={items} onReorder={vi.fn()} onRemove={onRemove} />);
    await user.click(screen.getAllByRole('button', { name: 'Remove' })[0]!);
    expect(onRemove).toHaveBeenCalledWith('Amount');
  });

  it('omits remove buttons when onRemove is not provided', () => {
    render(<SortableList items={items} onReorder={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull();
  });
});
