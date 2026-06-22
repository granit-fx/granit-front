import { screen } from '@testing-library/react';

import { MenusListPage } from '../menus-list-page';
import { mockMenus } from '../testing';

import { renderWithProviders } from './test-utils';

const { mockUseParams } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, useParams: mockUseParams };
});

const { mockUseMenus } = vi.hoisted(() => ({
  mockUseMenus: vi.fn(),
}));

vi.mock('@granit/react-cms', () => ({
  useMenus: mockUseMenus,
  useDeleteMenu: () => ({ mutate: vi.fn() }),
}));

describe('MenusListPage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: 'site-1' });
    mockUseMenus.mockReturnValue({ data: { items: mockMenus }, isLoading: false, isError: false });
  });

  afterEach(() => vi.clearAllMocks());

  it('renders the page title and data-slot', () => {
    renderWithProviders(<MenusListPage />, { route: '/cms/sites/site-1/menus' });
    expect(screen.getByRole('heading', { name: 'Menus' })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="menus-list-page"]')).toBeInTheDocument();
  });

  it('renders the new-menu action', () => {
    renderWithProviders(<MenusListPage />, { route: '/cms/sites/site-1/menus' });
    expect(screen.getByRole('button', { name: /New menu/i })).toBeInTheDocument();
  });

  it('renders the column headers', () => {
    renderWithProviders(<MenusListPage />, { route: '/cms/sites/site-1/menus' });
    expect(screen.getByRole('columnheader', { name: 'Key' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Items' })).toBeInTheDocument();
  });

  it('renders a row per menu with key, title and item count', () => {
    renderWithProviders(<MenusListPage />, { route: '/cms/sites/site-1/menus' });
    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText('Main navigation')).toBeInTheDocument();
    expect(screen.getByText('footer')).toBeInTheDocument();
    // first menu has 2 items
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders the empty state when there are no menus', () => {
    mockUseMenus.mockReturnValue({ data: { items: [] }, isLoading: false, isError: false });
    renderWithProviders(<MenusListPage />, { route: '/cms/sites/site-1/menus' });
    expect(screen.getByText('No menus found.')).toBeInTheDocument();
  });

  it('renders the loading row while fetching', () => {
    mockUseMenus.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderWithProviders(<MenusListPage />, { route: '/cms/sites/site-1/menus' });
    expect(screen.getByText('Loading menus…')).toBeInTheDocument();
  });

  it('renders the error message on failure', () => {
    mockUseMenus.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderWithProviders(<MenusListPage />, { route: '/cms/sites/site-1/menus' });
    expect(screen.getByText('Failed to load menus.')).toBeInTheDocument();
  });
});
