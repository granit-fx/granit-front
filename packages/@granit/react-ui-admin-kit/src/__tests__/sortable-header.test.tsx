import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SortableHeader } from '../querying/query-data-table/sortable-header';
import { renderWithI18n, setupI18n } from './test-utils';

beforeAll(setupI18n);

describe('SortableHeader', () => {
  it('renders the label inside a button', () => {
    renderWithI18n(<SortableHeader label="Name" onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /name/i })).toBeInTheDocument();
  });

  it('omits the sort-direction attribute when not sorted', () => {
    renderWithI18n(<SortableHeader label="Name" onToggle={vi.fn()} />);
    expect(screen.getByRole('button')).not.toHaveAttribute('data-sort-direction');
  });

  it('exposes the ascending direction', () => {
    renderWithI18n(<SortableHeader label="Name" direction="asc" onToggle={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('data-sort-direction', 'asc');
  });

  it('exposes the descending direction', () => {
    renderWithI18n(<SortableHeader label="Name" direction="desc" onToggle={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('data-sort-direction', 'desc');
  });

  it('invokes onToggle when clicked', async () => {
    const onToggle = vi.fn();
    renderWithI18n(<SortableHeader label="Name" onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('forwards the className', () => {
    renderWithI18n(<SortableHeader label="Name" onToggle={vi.fn()} className="custom-class" />);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });
});
