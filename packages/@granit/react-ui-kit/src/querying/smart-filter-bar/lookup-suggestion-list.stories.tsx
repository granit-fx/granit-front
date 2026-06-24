import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Command } from 'cmdk';
import { http, HttpResponse } from 'msw';
import { fn } from 'storybook/test';

import { LookupSuggestionList } from './lookup-suggestion-list';

import type {
  LookupDescriptor,
  LookupItemResponse,
  LookupResultResponse,
} from '@granit/data-lookup';
import type { Meta, StoryObj } from '@storybook/react-vite';

const ITEMS: readonly LookupItemResponse[] = [
  { value: 'Electronics', label: 'Electronics', extra: null },
  { value: 'Clothing', label: 'Clothing', extra: null },
  { value: 'Home', label: 'Home', extra: null },
  { value: 'Books', label: 'Books', extra: null },
];

const descriptor: LookupDescriptor = { name: 'product-categories', kind: 'Simple' };

const mockApiClient = createApiClient({ baseURL: '' });

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

/** Story-level handler — `useLookup` fetches `GET /lookups/:name`. */
const lookupHandler = http.get('/lookups/:name', ({ request }) => {
  const url = new URL(request.url);
  const search = (url.searchParams.get('search') ?? '').toLowerCase();
  const matched = search ? ITEMS.filter((i) => i.label.toLowerCase().includes(search)) : ITEMS;
  const body: LookupResultResponse = {
    items: matched,
    totalCount: matched.length,
    continuationToken: null,
  };
  return HttpResponse.json(body);
});

const meta = {
  title: 'Admin Kit/Querying/LookupSuggestionList',
  component: LookupSuggestionList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: { handlers: [lookupHandler] },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={makeQueryClient()}>
        <GranitClientProvider client={mockApiClient}>
          <div className="w-80 rounded-md border bg-popover shadow-md">
            <Command shouldFilter={false}>
              <Story />
            </Command>
          </div>
        </GranitClientProvider>
      </QueryClientProvider>
    ),
  ],
  args: {
    descriptor,
    tokens: [],
    onPickSingle: fn(),
    onPickMulti: fn(),
  },
} satisfies Meta<typeof LookupSuggestionList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Single-select lookup — items fetched from the registry endpoint. */
export const Default: Story = {
  args: {
    search: '',
    multi: false,
    selectedValuesCsv: '',
  },
};

/** Multi-select (In operator) — chosen values show a check and persist as CSV. */
export const MultiSelect: Story = {
  args: {
    search: '',
    multi: true,
    selectedValuesCsv: 'Electronics, Home',
  },
};

/** Filtered by the current search term forwarded to the API. */
export const Filtered: Story = {
  args: {
    search: 'cloth',
    multi: false,
    selectedValuesCsv: '',
  },
};

/** Empty Scope Trap — a scoped lookup with no resolved scope key. */
export const MissingScope: Story = {
  args: {
    descriptor: { name: 'meter-definitions', kind: 'QueryEngine', scopeKeys: ['tenantId'] },
    search: '',
    multi: false,
    selectedValuesCsv: '',
  },
};
