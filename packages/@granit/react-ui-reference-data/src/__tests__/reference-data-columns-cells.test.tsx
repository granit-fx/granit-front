import { screen } from '@testing-library/react';

import { createReferenceDataColumns } from '../components/reference-data-columns';

import { renderWithProviders, testI18n } from './test-utils';

import type { ReferenceDataEntry } from '../components/types';
import type { CellContext, ColumnDef } from '@tanstack/react-table';
import type { ReactElement } from 'react';

const t = testI18n.t.bind(testI18n);

function makeEntry(overrides: Partial<ReferenceDataEntry> = {}): ReferenceDataEntry {
  return {
    id: 'rd-1' as ReferenceDataEntry['id'],
    code: 'BE',
    label: 'Belgium',
    labelEn: 'Belgium',
    labelFr: 'Belgique',
    labelNl: 'België',
    labelDe: 'Belgien',
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
    activated: true,
    sortOrder: 1,
    validFrom: null,
    validTo: null,
    parentCode: null,
    metadata: null,
    ...overrides,
  };
}

function renderCell(
  column: ColumnDef<ReferenceDataEntry, unknown> | undefined,
  entry: ReferenceDataEntry
) {
  const cell = column?.cell;
  if (typeof cell !== 'function') throw new Error('cell renderer expected');
  const ctx = { row: { original: entry } } as unknown as CellContext<ReferenceDataEntry, unknown>;
  return renderWithProviders(cell(ctx) as ReactElement);
}

const callbacks = {
  t,
  onEdit: vi.fn(),
  onDeactivate: vi.fn(),
  onReactivate: vi.fn(),
};

describe('reference-data column cells', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the code and labelEn cells', () => {
    const columns = createReferenceDataColumns(callbacks);
    renderCell(
      columns.find((c) => c.id === 'code'),
      makeEntry({ code: 'FR' })
    );
    expect(screen.getByText('FR')).toBeInTheDocument();

    renderCell(
      columns.find((c) => c.id === 'labelEn'),
      makeEntry({ labelEn: 'France' })
    );
    expect(screen.getByText('France')).toBeInTheDocument();
  });

  it('renders the active badge when activated', () => {
    const columns = createReferenceDataColumns(callbacks);
    renderCell(
      columns.find((c) => c.id === 'activated'),
      makeEntry({ activated: true })
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders the inactive badge when deactivated', () => {
    const columns = createReferenceDataColumns(callbacks);
    renderCell(
      columns.find((c) => c.id === 'activated'),
      makeEntry({ activated: false })
    );
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders an em-dash when metadata is null', () => {
    const columns = createReferenceDataColumns(callbacks);
    const { container } = renderCell(
      columns.find((c) => c.id === 'metadata'),
      makeEntry({ metadata: null })
    );
    expect(container.textContent).toContain('—');
  });

  it('renders an em-dash when metadata is empty', () => {
    const columns = createReferenceDataColumns(callbacks);
    const { container } = renderCell(
      columns.find((c) => c.id === 'metadata'),
      makeEntry({ metadata: {} })
    );
    expect(container.textContent).toContain('—');
  });

  it('renders the first two metadata badges', () => {
    const columns = createReferenceDataColumns(callbacks);
    renderCell(
      columns.find((c) => c.id === 'metadata'),
      makeEntry({ metadata: { iso2: 'BE', iso3: 'BEL' } })
    );
    expect(screen.getByText(/iso2: BE/)).toBeInTheDocument();
    expect(screen.getByText(/iso3: BEL/)).toBeInTheDocument();
  });

  it('renders a +N badge when more than two metadata entries exist', () => {
    const columns = createReferenceDataColumns(callbacks);
    renderCell(
      columns.find((c) => c.id === 'metadata'),
      makeEntry({ metadata: { a: '1', b: '2', c: '3', d: '4' } })
    );
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('invokes onEdit and onDeactivate from the actions menu of an active entry', async () => {
    const columns = createReferenceDataColumns(callbacks);
    const entry = makeEntry({ code: 'IT', labelEn: 'Italy', activated: true });
    const { user } = renderCell(
      columns.find((c) => c.id === 'actions'),
      entry
    );
    await user.click(screen.getByRole('button', { name: 'Actions for Italy' }));
    await user.click(screen.getByText('Edit'));
    expect(callbacks.onEdit).toHaveBeenCalledWith('IT');

    await user.click(screen.getByRole('button', { name: 'Actions for Italy' }));
    await user.click(screen.getByText('Deactivate'));
    expect(callbacks.onDeactivate).toHaveBeenCalledWith(entry);
  });

  it('invokes onReactivate from the actions menu of an inactive entry', async () => {
    const columns = createReferenceDataColumns(callbacks);
    const entry = makeEntry({ labelEn: 'Spain', activated: false });
    const { user } = renderCell(
      columns.find((c) => c.id === 'actions'),
      entry
    );
    await user.click(screen.getByRole('button', { name: 'Actions for Spain' }));
    await user.click(screen.getByText('Reactivate'));
    expect(callbacks.onReactivate).toHaveBeenCalledWith(entry);
  });
});
