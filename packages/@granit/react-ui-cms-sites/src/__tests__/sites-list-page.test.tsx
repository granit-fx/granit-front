import { mockSites } from '@granit/react-cms/testing';
import { screen } from '@testing-library/react';

import { SitesListPage } from '../sites-list-page';

import { renderWithProviders } from './test-utils';

const { mockUseSites } = vi.hoisted(() => ({
  mockUseSites: vi.fn(),
}));

vi.mock('@granit/react-cms', () => ({
  useSites: mockUseSites,
  useDeleteSite: () => ({ mutate: vi.fn() }),
}));

describe('SitesListPage', () => {
  beforeEach(() => {
    mockUseSites.mockReturnValue({ data: { items: mockSites }, isLoading: false, isError: false });
  });

  afterEach(() => vi.clearAllMocks());

  it('renders the page title, subtitle and data-slot', () => {
    renderWithProviders(<SitesListPage />);
    expect(screen.getByRole('heading', { name: 'Sites' })).toBeInTheDocument();
    expect(screen.getByText('Manage your CMS sites and their content.')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="sites-list-page"]')).toBeInTheDocument();
  });

  it('renders the new-site action', () => {
    renderWithProviders(<SitesListPage />);
    expect(screen.getByRole('link', { name: /New site/i })).toBeInTheDocument();
  });

  it('renders the column headers', () => {
    renderWithProviders(<SitesListPage />);
    expect(screen.getByRole('columnheader', { name: 'Slug' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Cultures' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
  });

  it('renders a row per site with slug and resolved display name', () => {
    renderWithProviders(<SitesListPage />);
    expect(screen.getByText('corporate')).toBeInTheDocument();
    expect(screen.getByText('Corporate Website')).toBeInTheDocument();
    expect(screen.getByText('support')).toBeInTheDocument();
  });

  it('renders active/inactive status badges', () => {
    renderWithProviders(<SitesListPage />);
    expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders the empty state when there are no sites', () => {
    mockUseSites.mockReturnValue({ data: { items: [] }, isLoading: false, isError: false });
    renderWithProviders(<SitesListPage />);
    expect(screen.getByText('No sites found.')).toBeInTheDocument();
  });

  it('renders the loading row while fetching', () => {
    mockUseSites.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderWithProviders(<SitesListPage />);
    expect(screen.getByText('Loading sites…')).toBeInTheDocument();
  });

  it('renders the error message on failure', () => {
    mockUseSites.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderWithProviders(<SitesListPage />);
    expect(screen.getByText('Failed to load sites.')).toBeInTheDocument();
  });
});
