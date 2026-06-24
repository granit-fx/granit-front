import { screen } from '@testing-library/react';

import { PrivacyAgreementsPage } from '../components/privacy-agreements-page';

import { renderWithProviders } from './test-utils';

const documents = [
  { documentId: 'tos', currentVersion: '1.0', displayName: 'Terms of Service' },
  { documentId: 'privacy', currentVersion: '2.0', displayName: 'Privacy Policy' },
];

const statuses = [
  {
    documentId: 'tos',
    currentVersion: '1.0',
    hasAcceptedLatest: true,
    lastAcceptedAt: '2026-01-01T00:00:00Z',
  },
  {
    documentId: 'privacy',
    currentVersion: '2.0',
    hasAcceptedLatest: false,
    lastAcceptedAt: null,
  },
];

const hookState = {
  documents: { data: documents, isLoading: false } as Record<string, unknown>,
};

const mutate = vi.fn();

vi.mock('@granit/react-privacy', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useAgreementDocuments: () => hookState.documents,
    useAgreementStatuses: () => ({ data: statuses }),
    useAgreementHistory: () => ({ data: [] }),
    useAcceptAgreement: () => ({ mutate, isPending: false }),
  };
});

describe('PrivacyAgreementsPage', () => {
  beforeEach(() => {
    mutate.mockReset();
    hookState.documents = { data: documents, isLoading: false };
  });

  it('should render the page title and have data-slot attribute', () => {
    renderWithProviders(<PrivacyAgreementsPage />);
    expect(screen.getByText('Legal Documents')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="privacy-agreements-page"]')).toBeInTheDocument();
  });

  it('should list the agreement documents with their acceptance status', () => {
    renderWithProviders(<PrivacyAgreementsPage />);
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('should render the empty state when there are no documents', () => {
    hookState.documents = { data: [], isLoading: false };
    renderWithProviders(<PrivacyAgreementsPage />);
    expect(screen.getByText('No legal documents available')).toBeInTheDocument();
  });

  it('should show an accept button for pending documents', () => {
    renderWithProviders(<PrivacyAgreementsPage />);
    expect(screen.getByRole('button', { name: /Accept/i })).toBeInTheDocument();
  });
});
