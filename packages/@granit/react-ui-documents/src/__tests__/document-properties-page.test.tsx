import { screen } from '@testing-library/react';

import { DocumentPropertiesPage } from '../document-properties-page';

import { renderWithProviders } from './test-utils';

import type { DocumentPropertiesResponse } from '@granit/documents';

const { mockUseParams } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: mockUseParams,
  };
});

const { mockUseDocumentProperties } = vi.hoisted(() => ({
  mockUseDocumentProperties: vi.fn(),
}));

vi.mock('@granit/react-documents', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useDocumentProperties: mockUseDocumentProperties,
  };
});

vi.mock('@granit/react-localization', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useDateFormatter: () => ({
      formatDate: (v: string) => v,
      formatDateTime: (v: string) => `formatted:${v}`,
      formatTimeAgo: (v: string) => v,
    }),
  };
});

const mockProperties = {
  status: 'Completed',
  sourceContentType: 'application/pdf',
  extractorCount: 3,
  completedAt: '2026-01-15T10:00:00Z',
  failureReason: null,
  width: null,
  height: null,
  cameraMake: null,
  cameraModel: null,
  lensModel: null,
  iso: null,
  fNumber: null,
  exposureTimeMs: null,
  takenAt: null,
  gpsLatitude: null,
  gpsLongitude: null,
  pageCount: 12,
  title: 'Quarterly Report',
  author: 'Jane Doe',
  subject: null,
  keywords: null,
  producer: null,
  revision: null,
  durationMs: null,
  codec: null,
  bitrate: null,
  artist: null,
  album: null,
  trackNumber: null,
  genre: null,
} as unknown as DocumentPropertiesResponse;

describe('DocumentPropertiesPage', () => {
  afterEach(() => vi.clearAllMocks());

  it('renders the not-found state when the id param is missing', () => {
    mockUseParams.mockReturnValue({});
    mockUseDocumentProperties.mockReturnValue({ data: undefined, isLoading: false, error: null });
    renderWithProviders(<DocumentPropertiesPage />);
    expect(document.querySelector('[data-slot="document-properties-page"]')).toBeInTheDocument();
    expect(screen.getByText('Document not found.')).toBeInTheDocument();
  });

  it('renders the loading state', () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentProperties.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderWithProviders(<DocumentPropertiesPage />, { route: '/documents/doc-1/metadata' });
    expect(screen.getByText('Loading properties…')).toBeInTheDocument();
  });

  it('renders the error state', () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentProperties.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('boom'),
    });
    renderWithProviders(<DocumentPropertiesPage />, { route: '/documents/doc-1/metadata' });
    expect(screen.getByText('Failed to load properties.')).toBeInTheDocument();
  });

  it('renders property values and the timezone-formatted completed date', () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentProperties.mockReturnValue({
      data: mockProperties,
      isLoading: false,
      error: null,
    });
    renderWithProviders(<DocumentPropertiesPage />, { route: '/documents/doc-1/metadata' });
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('application/pdf')).toBeInTheDocument();
    expect(screen.getByText('Quarterly Report')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    // Date routed through the injected useDateFormatter mock.
    expect(screen.getByText('formatted:2026-01-15T10:00:00Z')).toBeInTheDocument();
  });
});
