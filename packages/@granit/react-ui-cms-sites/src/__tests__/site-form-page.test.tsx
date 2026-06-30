import { mockSites } from '@granit/react-cms/testing';
import { screen } from '@testing-library/react';

import { SiteFormPage } from '../components/site-form-page';

import { renderWithProviders } from './test-utils';

const site = mockSites[0]!;

const { mockUseParams } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, useParams: mockUseParams };
});

const { mockUseSite } = vi.hoisted(() => ({
  mockUseSite: vi.fn(),
}));

vi.mock('@granit/react-cms', () => ({
  useSite: mockUseSite,
  useCreateSite: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateSite: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('SiteFormPage', () => {
  afterEach(() => vi.clearAllMocks());

  describe('create mode', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({});
      mockUseSite.mockReturnValue({ data: undefined, isLoading: false });
    });

    it('renders the create heading and data-slot', () => {
      renderWithProviders(<SiteFormPage />, { route: '/cms/sites/new' });
      expect(screen.getByRole('heading', { name: 'New site' })).toBeInTheDocument();
      expect(document.querySelector('[data-slot="site-form-page"]')).toBeInTheDocument();
    });

    it('renders an empty, editable slug field', () => {
      renderWithProviders(<SiteFormPage />, { route: '/cms/sites/new' });
      const slug = screen.getByLabelText('Slug');
      expect(slug).toHaveValue('');
      expect(slug).not.toBeDisabled();
    });

    it('does not render the activated switch in create mode', () => {
      renderWithProviders(<SiteFormPage />, { route: '/cms/sites/new' });
      expect(screen.queryByLabelText('Activated')).not.toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({ id: site.id });
      mockUseSite.mockReturnValue({ data: site, isLoading: false });
    });

    it('renders the edit heading', () => {
      renderWithProviders(<SiteFormPage />, { route: `/cms/sites/${site.id}/edit` });
      expect(screen.getByRole('heading', { name: 'Edit site' })).toBeInTheDocument();
    });

    it('pre-fills and disables the slug field', () => {
      renderWithProviders(<SiteFormPage />, { route: `/cms/sites/${site.id}/edit` });
      const slug = screen.getByLabelText('Slug');
      expect(slug).toHaveValue(site.slug);
      expect(slug).toBeDisabled();
    });

    it('pre-fills allowed cultures and shows the activated switch', () => {
      renderWithProviders(<SiteFormPage />, { route: `/cms/sites/${site.id}/edit` });
      expect(screen.getByLabelText('Allowed cultures')).toHaveValue(
        site.allowedCultures.join(', ')
      );
      expect(screen.getByLabelText('Activated')).toBeInTheDocument();
    });

    it('renders the loading state while the site is fetched', () => {
      mockUseSite.mockReturnValue({ data: undefined, isLoading: true });
      renderWithProviders(<SiteFormPage />, { route: `/cms/sites/${site.id}/edit` });
      expect(screen.getByText('Loading…')).toBeInTheDocument();
    });
  });
});
