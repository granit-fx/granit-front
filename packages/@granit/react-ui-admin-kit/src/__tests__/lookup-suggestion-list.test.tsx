import { GranitClientProvider } from '@granit/react-api-client';
import { createTestQueryClient } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Command } from 'cmdk';

import { LookupSuggestionList } from '../querying/smart-filter-bar/lookup-suggestion-list';

import { renderWithI18n, setupI18n } from './test-utils';

import type { AxiosInstance } from '@granit/api-client';
import type { LookupDescriptor, LookupResultResponse } from '@granit/data-lookup';
import type { FilterToken } from '@granit/query-engine';
import type { ReactElement } from 'react';



function lookupResult(): LookupResultResponse {
  return {
    items: [
      { value: 'a', label: 'Acme', extra: null },
      { value: 'b', label: 'Beta', extra: null },
    ],
    totalCount: 2,
    continuationToken: null,
  };
}

interface RenderOptions {
  readonly descriptor?: LookupDescriptor;
  readonly tokens?: readonly FilterToken[];
  readonly multi?: boolean;
  readonly selectedValuesCsv?: string;
  readonly onPickSingle?: (value: string) => void;
  readonly onPickMulti?: (nextCsv: string) => void;
  readonly result?: LookupResultResponse;
}

function renderList({
  descriptor = { name: 'tenants' },
  tokens = [],
  multi = false,
  selectedValuesCsv = '',
  onPickSingle = vi.fn(),
  onPickMulti = vi.fn(),
  result = lookupResult(),
}: RenderOptions = {}) {
  const client = createMockClient();
  vi.mocked(client.get).mockResolvedValue(axiosResponse(result));
  const queryClient = createTestQueryClient();

  const ui: ReactElement = (
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={client as AxiosInstance}>
        <Command shouldFilter={false}>
          <LookupSuggestionList
            descriptor={descriptor}
            search="ac"
            tokens={tokens}
            multi={multi}
            selectedValuesCsv={selectedValuesCsv}
            onPickSingle={onPickSingle}
            onPickMulti={onPickMulti}
          />
        </Command>
      </GranitClientProvider>
    </QueryClientProvider>
  );
  return { ...renderWithI18n(ui), onPickSingle, onPickMulti, client };
}

beforeAll(setupI18n);

describe('LookupSuggestionList', () => {
  it('renders fetched lookup items', async () => {
    renderList();
    expect(await screen.findByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('shows the missing-scope placeholder when a scope key is unresolved', () => {
    const { container } = renderList({
      descriptor: { name: 'cities', scopeKeys: ['countryId'] },
      tokens: [],
    });
    expect(container.querySelector('[data-slot="lookup-missing-scope"]')).not.toBeNull();
  });

  it('renders items once the scope key is satisfied by a filter token', async () => {
    renderList({
      descriptor: { name: 'cities', scopeKeys: ['countryId'] },
      tokens: [
        {
          id: 'f1',
          type: 'filter',
          label: 'Country',
          field: 'countryId',
          operator: 'Eq',
          value: 'BE',
        },
      ],
    });
    expect(await screen.findByText('Acme')).toBeInTheDocument();
  });

  it('shows the empty placeholder when no items match', async () => {
    const { container } = renderList({
      result: { items: [], totalCount: 0, continuationToken: null },
    });
    await waitFor(() => {
      expect(container.querySelector('[data-slot="lookup-empty"]')).not.toBeNull();
    });
  });

  it('calls onPickSingle with the item value in single mode', async () => {
    const { onPickSingle } = renderList();
    await userEvent.click(await screen.findByText('Acme'));
    expect(onPickSingle).toHaveBeenCalledWith('a');
  });

  it('toggles a value into the csv in multi mode', async () => {
    const { onPickMulti } = renderList({ multi: true, selectedValuesCsv: '' });
    await userEvent.click(await screen.findByText('Beta'));
    expect(onPickMulti).toHaveBeenCalledWith('b');
  });

  it('removes an already-selected value in multi mode', async () => {
    const { onPickMulti } = renderList({ multi: true, selectedValuesCsv: 'a' });
    await userEvent.click(await screen.findByText('Acme'));
    expect(onPickMulti).toHaveBeenCalledWith('');
  });
});
