import { useSmartFilter } from '@granit/react-query-engine';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';


import { SmartFilterBar } from '../querying/smart-filter-bar/smart-filter-bar';

import { renderWithI18n, setupI18n } from './test-utils';

import type { QueryMetadata } from '@granit/query-engine';

function buildMetadata(): QueryMetadata {
  return {
    columns: [
      { name: 'name', label: 'Name', type: 'String', order: 0, isSortable: true, isFilterable: true, isVisible: true },
      { name: 'active', label: 'Active', type: 'Boolean', order: 1, isSortable: true, isFilterable: true, isVisible: true },
    ],
    filterableFields: [
      { name: 'name', type: 'String', operators: ['Contains', 'Eq'] },
      { name: 'active', type: 'Boolean', operators: ['Eq'] },
    ],
    sortableFields: [{ name: 'name' }],
    presetFilterGroups: [],
    quickFilters: [
      { name: 'mine', label: 'Mine', isDefault: false },
    ],
    dateFilters: [],
    groupByFields: [],
    pagination: { defaultPageSize: 25, maxPageSize: 100, maxStreamSize: 10_000, supportsCursor: false },
  };
}

function Harness({ metadata = buildMetadata() }: { metadata?: QueryMetadata }) {
  const smartFilter = useSmartFilter({ metadata });
  return (
    <div>
      <SmartFilterBar smartFilter={smartFilter} placeholder="Search or filter..." />
      <ul data-testid="tokens">
        {smartFilter.tokens.map((token) => (
          <li key={token.id}>{token.label}</li>
        ))}
      </ul>
    </div>
  );
}

function getInput(): HTMLElement {
  const el = document.querySelector<HTMLElement>('[data-slot="smart-filter-input"]');
  if (!el) throw new Error('smart-filter input not found');
  return el;
}

beforeAll(setupI18n);

describe('SmartFilterBar', () => {
  it('renders the search input', () => {
    renderWithI18n(<Harness />);
    expect(getInput()).toBeInTheDocument();
  });

  it('opens the suggestions popover with field suggestions on input', async () => {
    renderWithI18n(<Harness />);
    const input = getInput();
    await userEvent.click(input);
    await userEvent.type(input, 'nam');
    await waitFor(() => {
      expect(document.querySelector('[data-value="field-name"]')).not.toBeNull();
    });
  });

  it('commits a free-text search token on Enter when no suggestions are shown', async () => {
    renderWithI18n(<Harness metadata={{ ...buildMetadata(), filterableFields: [], quickFilters: [] }} />);
    const input = getInput();
    await userEvent.click(input);
    await userEvent.type(input, 'hello{Enter}');
    const tokens = screen.getByTestId('tokens');
    await waitFor(() => {
      expect(within(tokens).getByText('hello')).toBeInTheDocument();
    });
  });

  it('walks field → operator → value to build a filter token', async () => {
    renderWithI18n(<Harness />);
    const input = getInput();
    await userEvent.click(input);
    await userEvent.type(input, 'name');
    // Pick the field suggestion (the plain field item, not the search-prefixed one).
    const fieldItem = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-value="field-name"]');
      if (!el) throw new Error('field suggestion not yet rendered');
      return el;
    });
    await userEvent.click(fieldItem);
    // Operator phase: pick an operator.
    const opItem = await screen.findByText('Contains');
    await userEvent.click(opItem);
    // Value phase: free text + Enter.
    await userEvent.type(getInput(), 'acme{Enter}');
    const tokens = screen.getByTestId('tokens');
    await waitFor(() => {
      expect(within(tokens).getByText(/acme/i)).toBeInTheDocument();
    });
  });

  it('removes the last token on Backspace when the input is empty', async () => {
    renderWithI18n(<Harness metadata={{ ...buildMetadata(), filterableFields: [], quickFilters: [] }} />);
    const input = getInput();
    await userEvent.click(input);
    await userEvent.type(input, 'first{Enter}');
    const tokens = screen.getByTestId('tokens');
    await waitFor(() => {
      expect(within(tokens).getByText('first')).toBeInTheDocument();
    });
    await userEvent.click(getInput());
    await userEvent.keyboard('{Backspace}');
    await waitFor(() => {
      expect(within(tokens).queryByText('first')).toBeNull();
    });
  });

  it('clears all tokens via the clear-all button', async () => {
    renderWithI18n(<Harness metadata={{ ...buildMetadata(), filterableFields: [], quickFilters: [] }} />);
    const input = getInput();
    await userEvent.click(input);
    await userEvent.type(input, 'wipe{Enter}');
    const tokens = screen.getByTestId('tokens');
    await waitFor(() => {
      expect(within(tokens).getByText('wipe')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: 'Components.Querying.SmartFilter.ClearAll' }));
    await waitFor(() => {
      expect(within(tokens).queryByText('wipe')).toBeNull();
    });
  });

  it('adds a quick-filter token from a suggestion', async () => {
    renderWithI18n(<Harness />);
    const input = getInput();
    await userEvent.click(input);
    await userEvent.type(input, 'mine');
    const qfItem = await screen.findByText('Mine');
    await userEvent.click(qfItem);
    const tokens = screen.getByTestId('tokens');
    await waitFor(() => {
      expect(within(tokens).getByText('Mine')).toBeInTheDocument();
    });
  });
});
