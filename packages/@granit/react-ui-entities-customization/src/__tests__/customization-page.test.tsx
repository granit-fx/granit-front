import { screen } from '@testing-library/react';

import { CustomizationPage } from '../customization-page';

import { renderWithProviders } from './test-utils';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockHasPermission } = vi.hoisted(() => ({ mockHasPermission: vi.fn() }));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission, isLoading: false }),
}));

vi.mock('@granit/react-entities', () => ({
  useEntityDiscovery: () => ({ data: { modules: [] }, isLoading: false }),
  useEntityMetadata: () => ({ data: undefined, isLoading: false }),
}));

vi.mock('@granit/react-entities-customization', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useEntityCustomization: () => ({ data: undefined, isLoading: false }),
  usePutEntityCustomization: () => ({ mutate: vi.fn(), isPending: false }),
}));

// The Views tab also reaches into @granit/react-entities; nothing else to stub.

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CustomizationPage', () => {
  afterEach(() => vi.clearAllMocks());

  describe('with manage permissions granted', () => {
    beforeEach(() => {
      mockHasPermission.mockReturnValue(true);
    });

    it('should render the page title and subtitle', () => {
      renderWithProviders(<CustomizationPage />, { route: '/settings/customization' });
      expect(screen.getByText('Layout customization')).toBeInTheDocument();
      expect(
        screen.getByText('Reorder, regroup, and hide fields per entity (Layer 1 admin overrides).')
      ).toBeInTheDocument();
    });

    it('should render both top-level tabs', () => {
      renderWithProviders(<CustomizationPage />, { route: '/settings/customization' });
      expect(screen.getByRole('tab', { name: 'Layouts' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Views' })).toBeInTheDocument();
    });

    it('should render the page slot', () => {
      renderWithProviders(<CustomizationPage />, { route: '/settings/customization' });
      const root = document.querySelector('[data-slot="customization-page"]');
      expect(root).toBeInTheDocument();
      expect(root).not.toHaveTextContent('Access denied');
    });
  });

  describe('without manage permissions', () => {
    beforeEach(() => {
      mockHasPermission.mockReturnValue(false);
    });

    it('should render the access-denied branch', () => {
      renderWithProviders(<CustomizationPage />, { route: '/settings/customization' });
      expect(screen.getByText('Access denied')).toBeInTheDocument();
      expect(
        screen.getByText(
          'You need EntitiesCustomization.Forms.Manage or Entities.Views.Manage to use this page.'
        )
      ).toBeInTheDocument();
    });

    it('should not render the layout tabs', () => {
      renderWithProviders(<CustomizationPage />, { route: '/settings/customization' });
      expect(screen.queryByRole('tab', { name: 'Layouts' })).not.toBeInTheDocument();
    });
  });
});
