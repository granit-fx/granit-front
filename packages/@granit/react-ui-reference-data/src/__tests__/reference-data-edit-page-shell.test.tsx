import { screen } from '@testing-library/react';

import { ReferenceDataEditPageShell } from '../components/reference-data-edit-page-shell';

import { renderWithProviders } from './test-utils';

import type { ReferenceDataEntry } from '../components/types';

function makeEntry(overrides: Partial<ReferenceDataEntry> = {}): ReferenceDataEntry {
  return {
    id: 'rd-1' as ReferenceDataEntry['id'],
    code: 'BE',
    label: 'Belgium',
    labelEn: 'Belgium',
    labelFr: 'Belgique',
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
    activated: true,
    sortOrder: 0,
    validFrom: null,
    validTo: null,
    parentCode: null,
    metadata: null,
    ...overrides,
  };
}

const baseProps = {
  i18nPrefix: 'ReferenceData.Common',
  basePath: '/admin/countries',
  onDeactivate: vi.fn(),
  onReactivate: vi.fn(),
};

describe('ReferenceDataEditPageShell', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders a spinner while loading', () => {
    const { container } = renderWithProviders(
      <ReferenceDataEditPageShell {...baseProps} entry={undefined} isLoading error={null}>
        <div>form</div>
      </ReferenceDataEditPageShell>
    );
    expect(
      container.querySelector('[data-slot="reference-data-edit-page"]')
    ).not.toBeInTheDocument();
  });

  it('renders the not-found state when there is no entry', () => {
    renderWithProviders(
      <ReferenceDataEditPageShell {...baseProps} entry={undefined} isLoading={false} error={null}>
        <div>form</div>
      </ReferenceDataEditPageShell>
    );
    expect(document.querySelector('[data-slot="reference-data-edit-page"]')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/admin/countries');
    expect(screen.queryByText('form')).not.toBeInTheDocument();
  });

  it('renders the not-found state when an error is present', () => {
    renderWithProviders(
      <ReferenceDataEditPageShell
        {...baseProps}
        entry={makeEntry()}
        isLoading={false}
        error={new Error('boom')}
      >
        <div>form</div>
      </ReferenceDataEditPageShell>
    );
    expect(screen.queryByText('form')).not.toBeInTheDocument();
  });

  it('renders the entry header, code subtitle and the active badge for an active entry', () => {
    renderWithProviders(
      <ReferenceDataEditPageShell
        {...baseProps}
        entry={makeEntry({ labelEn: 'Belgium', code: 'BE', activated: true })}
        isLoading={false}
        error={null}
      >
        <div>form</div>
      </ReferenceDataEditPageShell>
    );
    expect(screen.getByText('Belgium')).toBeInTheDocument();
    expect(screen.getByText('BE')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('form')).toBeInTheDocument();
  });

  it('renders a custom subtitle when renderSubtitle is provided', () => {
    renderWithProviders(
      <ReferenceDataEditPageShell
        {...baseProps}
        entry={makeEntry()}
        isLoading={false}
        error={null}
        renderSubtitle={(e) => <span>custom-{e.code}</span>}
      >
        <div>form</div>
      </ReferenceDataEditPageShell>
    );
    expect(screen.getByText('custom-BE')).toBeInTheDocument();
  });

  it('calls onDeactivate from the action button of an active entry', async () => {
    const onDeactivate = vi.fn();
    const { user } = renderWithProviders(
      <ReferenceDataEditPageShell
        {...baseProps}
        onDeactivate={onDeactivate}
        entry={makeEntry({ activated: true })}
        isLoading={false}
        error={null}
      >
        <div>form</div>
      </ReferenceDataEditPageShell>
    );
    await user.click(screen.getByRole('button', { name: 'Deactivate' }));
    expect(onDeactivate).toHaveBeenCalledTimes(1);
  });

  it('shows the inactive badge and calls onReactivate for an inactive entry', async () => {
    const onReactivate = vi.fn();
    const { user } = renderWithProviders(
      <ReferenceDataEditPageShell
        {...baseProps}
        onReactivate={onReactivate}
        entry={makeEntry({ activated: false })}
        isLoading={false}
        error={null}
      >
        <div>form</div>
      </ReferenceDataEditPageShell>
    );
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reactivate' }));
    expect(onReactivate).toHaveBeenCalledTimes(1);
  });
});
