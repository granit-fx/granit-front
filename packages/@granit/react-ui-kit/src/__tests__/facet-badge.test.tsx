import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FacetBadge } from '../querying/smart-filter-bar/facet-badge';

import { renderWithI18n, setupI18n } from './test-utils';

import type { FilterToken } from '@granit/query-engine';

beforeAll(setupI18n);

const searchToken: FilterToken = {
  id: 'search-1',
  type: 'search',
  label: 'invoice',
};

const filterToken: FilterToken = {
  id: 'filter-1',
  type: 'filter',
  label: 'Status = Active',
  field: 'status',
  operator: 'Eq',
  value: 'Active',
  labelParts: { field: 'Status', operator: '=', value: 'Active' },
};

describe('FacetBadge', () => {
  it('renders the plain label for tokens without labelParts', () => {
    renderWithI18n(<FacetBadge token={searchToken} onRemove={vi.fn()} />);
    expect(screen.getByText('invoice')).toBeInTheDocument();
  });

  it('renders segmented label parts for filter tokens', () => {
    renderWithI18n(<FacetBadge token={filterToken} onRemove={vi.fn()} />);
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('=')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('exposes the token type via data attribute', () => {
    const { container } = renderWithI18n(<FacetBadge token={filterToken} onRemove={vi.fn()} />);
    expect(container.querySelector('[data-slot="facet-badge"]')).toHaveAttribute(
      'data-token-type',
      'filter'
    );
  });

  it('invokes onRemove with the token id when the remove button is clicked', async () => {
    const onRemove = vi.fn();
    renderWithI18n(<FacetBadge token={filterToken} onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Status = Active' }));
    expect(onRemove).toHaveBeenCalledWith('filter-1');
  });
});
