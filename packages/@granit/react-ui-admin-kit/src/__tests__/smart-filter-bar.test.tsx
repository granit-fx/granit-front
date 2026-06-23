import { useSmartFilter } from '@granit/react-query-engine';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SmartFilterBar } from '../querying/smart-filter-bar/smart-filter-bar';

import { renderWithI18n, setupI18n } from './test-utils';

import type { QueryMetadata } from '@granit/query-engine';

function buildMetadata(): QueryMetadata {
  return {
    columns: [
      {
        name: 'name',
        label: 'Name',
        type: 'String',
        order: 0,
        isSortable: true,
        isFilterable: true,
        isVisible: true,
      },
      {
        name: 'active',
        label: 'Active',
        type: 'Boolean',
        order: 1,
        isSortable: true,
        isFilterable: true,
        isVisible: true,
      },
      {
        name: 'createdAt',
        label: 'Created at',
        type: 'DateOnly',
        order: 2,
        isSortable: true,
        isFilterable: true,
        isVisible: true,
      },
      {
        name: 'updatedAt',
        label: 'Updated at',
        type: 'DateTime',
        order: 3,
        isSortable: true,
        isFilterable: true,
        isVisible: true,
      },
      {
        name: 'age',
        label: 'Age',
        type: 'Int32',
        order: 4,
        isSortable: true,
        isFilterable: true,
        isVisible: true,
      },
      {
        name: 'score',
        label: 'Score',
        type: 'Decimal',
        order: 5,
        isSortable: true,
        isFilterable: true,
        isVisible: true,
      },
    ],
    filterableFields: [
      { name: 'name', type: 'String', operators: ['Contains', 'Eq', 'In'] },
      { name: 'active', type: 'Boolean', operators: ['Eq'] },
      { name: 'createdAt', type: 'DateOnly', operators: ['Eq', 'Gte'] },
      { name: 'updatedAt', type: 'DateTime', operators: ['Gte'] },
      { name: 'age', type: 'Int32', operators: ['Eq', 'Gte'] },
      { name: 'score', type: 'Decimal', operators: ['Gte'] },
    ],
    sortableFields: [{ name: 'name' }],
    presetFilterGroups: [],
    quickFilters: [{ name: 'mine', label: 'Mine', isDefault: false }],
    dateFilters: [],
    groupByFields: [],
    pagination: {
      defaultPageSize: 25,
      maxPageSize: 100,
      maxStreamSize: 10_000,
      supportsCursor: false,
    },
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
    renderWithI18n(
      <Harness metadata={{ ...buildMetadata(), filterableFields: [], quickFilters: [] }} />
    );
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
  }, 15000);

  it('removes the last token on Backspace when the input is empty', async () => {
    renderWithI18n(
      <Harness metadata={{ ...buildMetadata(), filterableFields: [], quickFilters: [] }} />
    );
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
    renderWithI18n(
      <Harness metadata={{ ...buildMetadata(), filterableFields: [], quickFilters: [] }} />
    );
    const input = getInput();
    await userEvent.click(input);
    await userEvent.type(input, 'wipe{Enter}');
    const tokens = screen.getByTestId('tokens');
    await waitFor(() => {
      expect(within(tokens).getByText('wipe')).toBeInTheDocument();
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Components.Querying.SmartFilter.ClearAll' })
    );
    await waitFor(() => {
      expect(within(tokens).queryByText('wipe')).toBeNull();
    });
  });

  it('renders a native date input and commits a DateOnly filter value', async () => {
    renderWithI18n(<Harness />);
    const input = getInput();
    await userEvent.click(input);
    await userEvent.type(input, 'createdAt');
    const fieldItem = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-value="field-createdAt"]');
      if (!el) throw new Error('date field suggestion not yet rendered');
      return el;
    });
    await userEvent.click(fieldItem);
    // Operator phase: pick a non-"In" operator so the date input is rendered.
    await userEvent.click(await screen.findByText('Gte'));

    // Value phase now renders the browser-native date input (not Command.Input).
    const dateInput = await waitFor(() => {
      const el = document.querySelector<HTMLInputElement>('[data-slot="smart-filter-input"]');
      if (!el || el.type !== 'date') throw new Error('date input not yet rendered');
      return el;
    });
    fireEvent.change(dateInput, { target: { value: '2026-01-15' } });
    expect(dateInput.value).toBe('2026-01-15');

    fireEvent.keyDown(dateInput, { key: 'Enter' });
    const tokens = screen.getByTestId('tokens');
    await waitFor(() => {
      expect(within(tokens).getByText(/2026-01-15/)).toBeInTheDocument();
    });
  }, 15000);

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

  // Walk field → operator and stop at the value phase for the given field.
  async function reachValuePhase(fieldName: string, operatorLabel: string) {
    const input = getInput();
    await userEvent.click(input);
    await userEvent.type(input, fieldName);
    const fieldItem = await waitFor(() => {
      const el = document.querySelector<HTMLElement>(`[data-value="field-${fieldName}"]`);
      if (!el) throw new Error(`${fieldName} field suggestion not yet rendered`);
      return el;
    });
    await userEvent.click(fieldItem);
    await userEvent.click(await screen.findByText(operatorLabel));
  }

  it('renders a datetime-local input for a DateTime field value', async () => {
    renderWithI18n(<Harness />);
    await reachValuePhase('updatedAt', 'Gte');
    const dt = await waitFor(() => {
      const el = document.querySelector<HTMLInputElement>('[data-slot="smart-filter-input"]');
      if (!el || el.type !== 'datetime-local') throw new Error('datetime-local input not rendered');
      return el;
    });
    expect(dt.type).toBe('datetime-local');
  }, 15000);

  it('sanitizes an integer field value down to digits', async () => {
    renderWithI18n(<Harness />);
    await reachValuePhase('age', 'Gte');
    const input = await waitFor(() => {
      const el = document.querySelector<HTMLInputElement>('[data-slot="smart-filter-input"]');
      if (!el) throw new Error('value input not rendered');
      return el;
    });
    expect(input).toHaveAttribute('inputmode', 'numeric');
    await userEvent.type(input, '12a3');
    await waitFor(() => expect(input.value).toBe('123'));
  }, 15000);

  it('sanitizes a decimal field value to digits and a single separator', async () => {
    renderWithI18n(<Harness />);
    await reachValuePhase('score', 'Gte');
    const input = await waitFor(() => {
      const el = document.querySelector<HTMLInputElement>('[data-slot="smart-filter-input"]');
      if (!el) throw new Error('value input not rendered');
      return el;
    });
    expect(input).toHaveAttribute('inputmode', 'decimal');
    await userEvent.type(input, '1a2.5');
    await waitFor(() => expect(input.value).toBe('12.5'));
  }, 15000);

  it('toggles multiple values for the In operator instead of confirming', async () => {
    renderWithI18n(<Harness />);
    await reachValuePhase('name', 'In');
    const input = getInput() as HTMLInputElement;
    // Free-text entries with the In operator accumulate a CSV in the input,
    // rather than each one committing a token immediately.
    await userEvent.type(input, 'acme');
    await waitFor(() => expect(input.value).toContain('acme'));
    // No token committed yet — still building the value list.
    expect(within(screen.getByTestId('tokens')).queryByText(/acme/)).toBeNull();
  }, 15000);

  it('cancels the active phase and blurs on Escape', async () => {
    renderWithI18n(<Harness />);
    const input = getInput();
    await userEvent.click(input);
    await userEvent.type(input, 'name');
    await waitFor(() => {
      expect(document.querySelector('[data-value="field-name"]')).not.toBeNull();
    });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(document.querySelector('[data-value="field-name"]')).toBeNull();
    });
  }, 15000);
});
