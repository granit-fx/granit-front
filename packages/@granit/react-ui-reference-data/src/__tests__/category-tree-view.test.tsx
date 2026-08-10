import { screen } from '@testing-library/react';

import { CategoryTreeView } from '../components/category-tree-view';

import { renderWithProviders } from './test-utils';

import type { ReferenceDataResponse } from '../components/types';
import type { UseQueryResult } from '@tanstack/react-query';

function makeEntry(overrides: Partial<ReferenceDataResponse> = {}): ReferenceDataResponse {
  return {
    id: 'rd-1' as ReferenceDataResponse['id'],
    code: 'EUR',
    label: 'Europe',
    labelEn: 'Europe',
    labelFr: 'Europe',
    labelNl: '',
    labelDe: '',
    labelEs: '',
    labelIt: '',
    labelPt: '',
    labelZh: '',
    labelJa: '',
    labelPl: '',
    labelTr: '',
    labelKo: '',
    labelSv: '',
    labelCs: '',
    labelHi: '',
    activated: true,
    sortOrder: 0,
    validFrom: null,
    validTo: null,
    parentCode: null,
    metadata: null,
    ...overrides,
  };
}

type QueryStub = Pick<UseQueryResult<ReferenceDataResponse[]>, 'data' | 'isLoading'>;

function queryResult(stub: QueryStub) {
  return stub as unknown as UseQueryResult<ReferenceDataResponse[]>;
}

describe('CategoryTreeView', () => {
  it('renders a spinner while loading', () => {
    const { container } = renderWithProviders(
      <CategoryTreeView
        roots={[]}
        isLoading
        useChildren={() => queryResult({ data: [], isLoading: false })}
        apiClient={{}}
        onSelect={vi.fn()}
      />
    );
    expect(container.querySelector('[data-slot="category-tree-view"]')).not.toBeInTheDocument();
  });

  it('renders the empty state when there are no roots', () => {
    renderWithProviders(
      <CategoryTreeView
        roots={[]}
        useChildren={() => queryResult({ data: [], isLoading: false })}
        apiClient={{}}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('renders root nodes with code, label and an inactive badge', () => {
    renderWithProviders(
      <CategoryTreeView
        roots={[makeEntry({ code: 'EU', labelEn: 'Europe', activated: false })]}
        useChildren={() => queryResult({ data: [], isLoading: false })}
        apiClient={{}}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText('EU')).toBeInTheDocument();
    expect(screen.getByText('Europe')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="category-tree-view"]')).toBeInTheDocument();
  });

  it('calls onSelect with the node code when the label button is clicked', async () => {
    const onSelect = vi.fn();
    const { user } = renderWithProviders(
      <CategoryTreeView
        roots={[makeEntry({ code: 'EU', labelEn: 'Europe' })]}
        useChildren={() => queryResult({ data: [], isLoading: false })}
        apiClient={{}}
        onSelect={onSelect}
      />
    );
    await user.click(screen.getByText('Europe'));
    expect(onSelect).toHaveBeenCalledWith('EU');
  });

  it('expands a node and renders its children, then collapses', async () => {
    const useChildren = vi.fn((parentCode: string) => {
      if (parentCode === 'EU') {
        return queryResult({
          data: [makeEntry({ code: 'BE', labelEn: 'Belgium' })],
          isLoading: false,
        });
      }
      return queryResult({ data: [], isLoading: false });
    });
    const { user, container } = renderWithProviders(
      <CategoryTreeView
        roots={[makeEntry({ code: 'EU', labelEn: 'Europe' })]}
        useChildren={useChildren}
        apiClient={{ id: 'client' }}
        onSelect={vi.fn()}
      />
    );
    // First button on the row is the expand chevron toggle.
    const toggle = container.querySelectorAll('button')[0]!;
    await user.click(toggle);
    expect(screen.getByText('BE')).toBeInTheDocument();
    expect(screen.getByText('Belgium')).toBeInTheDocument();

    await user.click(toggle);
    expect(screen.queryByText('Belgium')).not.toBeInTheDocument();
  });

  it('shows a child spinner while the children query is loading', async () => {
    const { user, container } = renderWithProviders(
      <CategoryTreeView
        roots={[makeEntry({ code: 'EU', labelEn: 'Europe' })]}
        useChildren={() => queryResult({ data: undefined, isLoading: true })}
        apiClient={{}}
        onSelect={vi.fn()}
      />
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    const toggle = container.querySelectorAll('button')[0]!;
    await user.click(toggle);
    // A loading spinner appears within the expanded subtree.
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
