import { screen } from '@testing-library/react';

import { LegalDocumentCreatePage } from '../legal-documents/legal-document-create-page';

import { renderWithProviders } from './test-utils';

const { mockMutate } = vi.hoisted(() => ({ mockMutate: vi.fn() }));

vi.mock('@granit/react-privacy', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useCreateLegalDocument: () => ({ mutate: mockMutate, isPending: false }),
  };
});

describe('LegalDocumentCreatePage', () => {
  afterEach(() => vi.clearAllMocks());

  it('should render the create title', () => {
    renderWithProviders(<LegalDocumentCreatePage />);
    expect(screen.getByText('Create Legal Document')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    renderWithProviders(<LegalDocumentCreatePage />);
    expect(document.querySelector('[data-slot="legal-document-create-page"]')).toBeInTheDocument();
  });

  it('should render the create form', () => {
    renderWithProviders(<LegalDocumentCreatePage />);
    expect(document.querySelector('[data-slot="legal-document-form"]')).toBeInTheDocument();
  });

  it('should render the document id field in create mode', () => {
    renderWithProviders(<LegalDocumentCreatePage />);
    expect(screen.getByText('Document ID')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('privacy-policy')).toBeInTheDocument();
  });

  it('should render the display name field', () => {
    renderWithProviders(<LegalDocumentCreatePage />);
    expect(screen.getByText('Display Name')).toBeInTheDocument();
  });

  it('should render the save and cancel buttons', () => {
    renderWithProviders(<LegalDocumentCreatePage />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });
});
