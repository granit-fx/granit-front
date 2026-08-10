import { screen } from '@testing-library/react';

import { ReferenceDataCard } from '../components/reference-data-card';

import { renderWithProviders } from './test-utils';

import type { ReferenceDataResponse } from '../components/types';

function makeEntry(overrides: Partial<ReferenceDataResponse> = {}): ReferenceDataResponse {
  return {
    id: 'rd-1' as ReferenceDataResponse['id'],
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
    labelHi: '',
    activated: true,
    sortOrder: 3,
    validFrom: null,
    validTo: null,
    parentCode: null,
    metadata: null,
    ...overrides,
  };
}

const handlers = {
  onEdit: vi.fn(),
  onDeactivate: vi.fn(),
  onReactivate: vi.fn(),
};

describe('ReferenceDataCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders code, the preferred French label and sortOrder', () => {
    renderWithProviders(<ReferenceDataCard entry={makeEntry()} {...handlers} />);
    expect(screen.getByText('BE')).toBeInTheDocument();
    expect(screen.getByText('Belgique')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="reference-data-card"]')).toBeInTheDocument();
  });

  it('falls back to labelEn when labelFr is empty', () => {
    renderWithProviders(
      <ReferenceDataCard entry={makeEntry({ labelFr: '', labelEn: 'Belgium' })} {...handlers} />
    );
    expect(screen.getAllByText('Belgium').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the active badge for an activated entry', () => {
    renderWithProviders(<ReferenceDataCard entry={makeEntry({ activated: true })} {...handlers} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows the inactive badge and dims when deactivated', () => {
    renderWithProviders(
      <ReferenceDataCard entry={makeEntry({ activated: false })} {...handlers} />
    );
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="reference-data-card"]')?.className).toContain(
      'opacity-70'
    );
  });

  it('renders metadata badges when present', () => {
    renderWithProviders(
      <ReferenceDataCard entry={makeEntry({ metadata: { iso2: 'BE' } })} {...handlers} />
    );
    expect(screen.getByText(/iso2: BE/)).toBeInTheDocument();
  });

  it('renders app-specific children', () => {
    renderWithProviders(
      <ReferenceDataCard entry={makeEntry()} {...handlers}>
        <span>Extra slot</span>
      </ReferenceDataCard>
    );
    expect(screen.getByText('Extra slot')).toBeInTheDocument();
  });

  it('invokes onEdit and onDeactivate from the menu of an active entry', async () => {
    const entry = makeEntry({ code: 'IT', labelEn: 'Italy', activated: true });
    const { user } = renderWithProviders(<ReferenceDataCard entry={entry} {...handlers} />);
    await user.click(screen.getByRole('button', { name: 'Actions for Italy' }));
    await user.click(screen.getByText('Edit'));
    expect(handlers.onEdit).toHaveBeenCalledWith('IT');

    await user.click(screen.getByRole('button', { name: 'Actions for Italy' }));
    await user.click(screen.getByText('Deactivate'));
    expect(handlers.onDeactivate).toHaveBeenCalledWith(entry);
  });

  it('invokes onReactivate from the menu of an inactive entry', async () => {
    const entry = makeEntry({ labelEn: 'Spain', activated: false });
    const { user } = renderWithProviders(<ReferenceDataCard entry={entry} {...handlers} />);
    await user.click(screen.getByRole('button', { name: 'Actions for Spain' }));
    await user.click(screen.getByText('Reactivate'));
    expect(handlers.onReactivate).toHaveBeenCalledWith(entry);
  });
});
