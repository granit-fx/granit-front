import { screen } from '@testing-library/react';

import { PageFormPage } from '../components/page-form-page';
import { mockPageTree } from '../testing';

import { renderWithProviders } from './test-utils';

const site = { id: 'site-1', slug: 'corporate', defaultCulture: 'en-GB' };
const pageDetail = {
  ...mockPageTree[1],
  siteId: site.id,
  kind: 'content',
  layoutKey: null,
  translations: [],
};

let mockParams: Record<string, string | undefined> = {};

vi.mock('react-router', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useParams: () => mockParams };
});

// `renderer.ts` reads VITE_CMS_RENDERER_URL at module-load time, and a host
// `.env` may set it — so force the *unconfigured* case here, exercising the
// disabled link-out branch deterministically regardless of the local env.
vi.mock('../renderer', () => ({
  buildPageEditorUrl: () => null,
}));

vi.mock('@granit/react-cms', () => ({
  usePageTree: () => ({ data: mockPageTree }),
  useSite: () => ({ data: site }),
  usePage: (_id: string, opts?: { enabled?: boolean }) => ({
    data: opts?.enabled ? pageDetail : undefined,
    isLoading: false,
  }),
  useCreatePage: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdatePage: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('PageFormPage', () => {
  describe('create mode', () => {
    beforeEach(() => {
      mockParams = { id: site.id };
    });

    it('renders the create heading and slug field', () => {
      renderWithProviders(<PageFormPage />, { route: `/cms/sites/${site.id}/pages/new` });
      expect(screen.getByRole('heading', { name: 'New page' })).toBeInTheDocument();
      expect(screen.getByLabelText('Slug segment')).toBeInTheDocument();
    });

    it('shows the parent selector in create mode', () => {
      renderWithProviders(<PageFormPage />, { route: `/cms/sites/${site.id}/pages/new` });
      expect(screen.getByText('Parent page')).toBeInTheDocument();
    });

    it('has the correct data-slot', () => {
      renderWithProviders(<PageFormPage />, { route: `/cms/sites/${site.id}/pages/new` });
      expect(document.querySelector('[data-slot="page-form-page"]')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    beforeEach(() => {
      mockParams = { id: site.id, pageId: pageDetail.id };
    });

    it('renders the edit heading and pre-fills the slug', () => {
      renderWithProviders(<PageFormPage />, {
        route: `/cms/sites/${site.id}/pages/${pageDetail.id}/edit`,
      });
      expect(screen.getByRole('heading', { name: 'Edit page' })).toBeInTheDocument();
      expect(screen.getByLabelText('Slug segment')).toHaveValue(pageDetail.slugSegment);
    });

    it('disables the "Edit content" link-out when no renderer URL is configured', () => {
      renderWithProviders(<PageFormPage />, {
        route: `/cms/sites/${site.id}/pages/${pageDetail.id}/edit`,
      });
      expect(screen.getByRole('button', { name: /Edit content/i })).toBeDisabled();
    });
  });
});
