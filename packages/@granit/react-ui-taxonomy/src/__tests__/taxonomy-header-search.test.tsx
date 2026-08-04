import { screen } from '@testing-library/react';

import { TaxonomyHeaderSearch } from '../components/taxonomy-header-search';
import { TAXONOMY_TARGET_TYPES } from '../constants';

import { renderWithProviders } from './test-utils';

import type { TaxonomySearchResultItem } from '@granit/taxonomy';

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }));

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useNavigate: () => mockNavigate,
}));

// The headless search bar is stubbed: it surfaces its `onSelect` and the
// localised `targetTypeLabels`/`labels` props so the header wrapper's routing
// and label wiring can be asserted in isolation.
let capturedOnSelect: ((item: TaxonomySearchResultItem) => void) | undefined;

vi.mock('@granit/react-taxonomy', () => ({
  TaxonomySearchBar: ({
    onSelect,
    targetTypeLabels,
    labels,
    className,
  }: {
    onSelect: (item: TaxonomySearchResultItem) => void;
    targetTypeLabels: Record<string, string>;
    labels: Record<string, string>;
    className?: string;
  }) => {
    capturedOnSelect = onSelect;
    return (
      <div
        data-testid="search-bar-stub"
        data-class={className}
        data-document-label={targetTypeLabels[TAXONOMY_TARGET_TYPES.Document]}
        data-party-label={targetTypeLabels[TAXONOMY_TARGET_TYPES.Party]}
        data-placeholder={labels.placeholder}
      />
    );
  },
}));

function makeItem(overrides: Partial<TaxonomySearchResultItem>): TaxonomySearchResultItem {
  return {
    targetType: TAXONOMY_TARGET_TYPES.Document,
    targetId: 'id-1',
    label: 'A document',
    snippet: null,
    matchedTagIds: [],
    matchedCategoryId: null,
    ...overrides,
  };
}

describe('TaxonomyHeaderSearch', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    capturedOnSelect = undefined;
  });

  it('renders the headless search bar with localised labels', () => {
    renderWithProviders(<TaxonomyHeaderSearch />);
    const stub = screen.getByTestId('search-bar-stub');
    expect(stub.dataset.documentLabel).toBe('Documents');
    expect(stub.dataset.partyLabel).toBe('Parties');
    expect(stub.dataset.placeholder).toBe('Search by tag or category…');
    expect(stub.dataset.class).toContain('lg:block');
  });

  it('navigates to the document detail route on selecting a document result', () => {
    renderWithProviders(<TaxonomyHeaderSearch />);
    capturedOnSelect?.(
      makeItem({ targetType: TAXONOMY_TARGET_TYPES.Document, targetId: 'doc-42' })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/documents/doc-42');
  });

  it('navigates to the party detail route on selecting a party result', () => {
    renderWithProviders(<TaxonomyHeaderSearch />);
    capturedOnSelect?.(makeItem({ targetType: TAXONOMY_TARGET_TYPES.Party, targetId: 'party-7' }));
    expect(mockNavigate).toHaveBeenCalledWith('/parties/party-7');
  });

  it('does not navigate when the target type has no registered route', () => {
    renderWithProviders(<TaxonomyHeaderSearch />);
    capturedOnSelect?.(makeItem({ targetType: 'Granit.Unknown.Domain.Thing', targetId: 'x' }));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
