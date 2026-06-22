import { screen } from '@testing-library/react';

import { MenuFormPage } from '../menu-form-page';
import { mockMenus } from '../testing';

import { renderWithProviders } from './test-utils';

const menu = mockMenus[0]!;
const siteId = 'site-1';

const { mockUseParams } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, useParams: mockUseParams };
});

const { mockUseMenu } = vi.hoisted(() => ({
  mockUseMenu: vi.fn(),
}));

vi.mock('@granit/react-cms', () => ({
  useMenu: mockUseMenu,
  useCreateMenu: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateMenu: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('MenuFormPage', () => {
  afterEach(() => vi.clearAllMocks());

  describe('create mode', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({ id: siteId });
      mockUseMenu.mockReturnValue({ data: undefined, isLoading: false });
    });

    it('renders the create heading and data-slot', () => {
      renderWithProviders(<MenuFormPage />, { route: `/cms/sites/${siteId}/menus/new` });
      expect(screen.getByRole('heading', { name: 'New menu' })).toBeInTheDocument();
      expect(document.querySelector('[data-slot="menu-form-page"]')).toBeInTheDocument();
    });

    it('renders an empty, editable key field and the items field', () => {
      renderWithProviders(<MenuFormPage />, { route: `/cms/sites/${siteId}/menus/new` });
      const key = screen.getByLabelText('Key');
      expect(key).toHaveValue('');
      expect(key).not.toBeDisabled();
      expect(screen.getByLabelText('Items (JSON)')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({ id: siteId, menuId: menu.id });
      mockUseMenu.mockReturnValue({ data: menu, isLoading: false });
    });

    it('renders the edit heading', () => {
      renderWithProviders(<MenuFormPage />, {
        route: `/cms/sites/${siteId}/menus/${menu.id}/edit`,
      });
      expect(screen.getByRole('heading', { name: 'Edit menu' })).toBeInTheDocument();
    });

    it('pre-fills and disables the key field and pre-fills the title', () => {
      renderWithProviders(<MenuFormPage />, {
        route: `/cms/sites/${siteId}/menus/${menu.id}/edit`,
      });
      const key = screen.getByLabelText('Key');
      expect(key).toHaveValue(menu.key);
      expect(key).toBeDisabled();
      expect(screen.getByLabelText('Title')).toHaveValue(menu.title);
    });

    it('renders the loading state while the menu is fetched', () => {
      mockUseMenu.mockReturnValue({ data: undefined, isLoading: true });
      renderWithProviders(<MenuFormPage />, {
        route: `/cms/sites/${siteId}/menus/${menu.id}/edit`,
      });
      expect(screen.getByText('Loading…')).toBeInTheDocument();
    });
  });
});
