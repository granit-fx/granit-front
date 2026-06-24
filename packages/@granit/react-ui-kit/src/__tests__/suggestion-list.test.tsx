import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Command } from 'cmdk';

import { SuggestionList } from '../querying/smart-filter-bar/suggestion-list';

import { renderWithI18n, setupI18n } from './test-utils';

import type { FilterSuggestion } from '@granit/query-engine';
import type { ReactElement } from 'react';

beforeAll(setupI18n);

function renderInCommand(ui: ReactElement) {
  return renderWithI18n(<Command>{ui}</Command>);
}

const fieldSuggestion: FilterSuggestion = {
  id: 'status',
  type: 'filter',
  label: 'Status',
  description: 'Filter by status',
};

const valueSuggestion: FilterSuggestion = {
  id: 'status:active',
  type: 'filter',
  label: 'Active',
  selected: true,
};

const searchSuggestion: FilterSuggestion = {
  id: 'search-name',
  type: 'filter',
  label: 'Name',
  searchValue: 'john',
};

describe('SuggestionList', () => {
  it('renders an empty state when there are no suggestions', () => {
    renderInCommand(<SuggestionList suggestions={[]} onSelect={vi.fn()} />);
    const empty = document.querySelector('[data-slot="suggestion-empty"]');
    expect(empty).toHaveTextContent('No suggestions found.');
  });

  it('renders each suggestion as an item with its label and description', () => {
    renderInCommand(<SuggestionList suggestions={[fieldSuggestion]} onSelect={vi.fn()} />);
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Filter by status')).toBeInTheDocument();
  });

  it('renders the search prefix/suffix and search value for search suggestions', () => {
    renderInCommand(<SuggestionList suggestions={[searchSuggestion]} onSelect={vi.fn()} />);
    const item = document.querySelector('[data-slot="suggestion-item"]');
    expect(item?.textContent).toContain('SmartFilter.SearchFieldPrefix');
    expect(item?.textContent).toContain('SmartFilter.SearchFieldSuffix');
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('john')).toBeInTheDocument();
  });

  it('exposes the suggestion type via data attribute', () => {
    renderInCommand(<SuggestionList suggestions={[valueSuggestion]} onSelect={vi.fn()} />);
    const item = document.querySelector('[data-slot="suggestion-item"]');
    expect(item).toHaveAttribute('data-suggestion-type', 'filter');
  });

  it('invokes onSelect with the suggestion when an item is clicked', async () => {
    const onSelect = vi.fn();
    renderInCommand(<SuggestionList suggestions={[fieldSuggestion]} onSelect={onSelect} />);
    await userEvent.click(screen.getByText('Status'));
    expect(onSelect).toHaveBeenCalledWith(fieldSuggestion);
  });
});
