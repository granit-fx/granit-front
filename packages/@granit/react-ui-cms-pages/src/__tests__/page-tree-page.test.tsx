import { screen } from '@testing-library/react';

import { PageTreePage } from '../components/page-tree-page';
import { mockPageTree } from '../testing';

import { renderWithProviders } from './test-utils';

const siteId = 'site-1';

const { mockUseParams } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
}));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, useParams: mockUseParams };
});

const { mockUsePageTree } = vi.hoisted(() => ({
  mockUsePageTree: vi.fn(),
}));

vi.mock('@granit/react-cms', () => ({
  usePageTree: mockUsePageTree,
  useDeletePage: () => ({ mutate: vi.fn() }),
}));

describe('PageTreePage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: siteId });
    mockUsePageTree.mockReturnValue({ data: mockPageTree, isLoading: false, isError: false });
  });

  afterEach(() => vi.clearAllMocks());

  it('renders the page title and data-slot', () => {
    renderWithProviders(<PageTreePage />, { route: `/cms/sites/${siteId}/pages` });
    expect(screen.getByRole('heading', { name: 'Pages' })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="page-tree-page"]')).toBeInTheDocument();
  });

  it('renders the new-page action', () => {
    renderWithProviders(<PageTreePage />, { route: `/cms/sites/${siteId}/pages` });
    expect(screen.getByRole('link', { name: /New page/i })).toBeInTheDocument();
  });

  it('renders the column headers', () => {
    renderWithProviders(<PageTreePage />, { route: `/cms/sites/${siteId}/pages` });
    expect(screen.getByRole('columnheader', { name: 'Path' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Depth' })).toBeInTheDocument();
  });

  it('renders a row per page node with its structure path', () => {
    renderWithProviders(<PageTreePage />, { route: `/cms/sites/${siteId}/pages` });
    expect(screen.getByText('/about')).toBeInTheDocument();
    expect(screen.getByText('/about/team')).toBeInTheDocument();
    expect(screen.getByText('/contact')).toBeInTheDocument();
  });

  it('renders the empty state when the tree is empty', () => {
    mockUsePageTree.mockReturnValue({ data: [], isLoading: false, isError: false });
    renderWithProviders(<PageTreePage />, { route: `/cms/sites/${siteId}/pages` });
    expect(screen.getByText('No pages found.')).toBeInTheDocument();
  });

  it('renders the loading row while fetching', () => {
    mockUsePageTree.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderWithProviders(<PageTreePage />, { route: `/cms/sites/${siteId}/pages` });
    expect(screen.getByText('Loading pages…')).toBeInTheDocument();
  });

  it('renders the error message on failure', () => {
    mockUsePageTree.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderWithProviders(<PageTreePage />, { route: `/cms/sites/${siteId}/pages` });
    expect(screen.getByText('Failed to load pages.')).toBeInTheDocument();
  });
});
