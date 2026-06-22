import { screen } from '@testing-library/react';

import { RedirectsListPage } from '../redirects-list-page';

import { mockRedirects, renderCmsRedirects } from './test-utils';

vi.mock('@granit/react-cms-redirects', () => ({
  useRedirects: () => ({ data: mockRedirects, isLoading: false, isError: false }),
  useDeleteRedirect: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateRedirect: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateRedirect: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('RedirectsListPage', () => {
  it('renders the Redirects heading and data-slot', () => {
    renderCmsRedirects(<RedirectsListPage />);
    expect(screen.getByRole('heading', { name: 'Redirects' })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="redirects-list-page"]')).toBeInTheDocument();
  });

  it('renders the mocked redirect rows', () => {
    renderCmsRedirects(<RedirectsListPage />);
    expect(screen.getByText(mockRedirects[0].source)).toBeInTheDocument();
    expect(screen.getByText(mockRedirects[0].target)).toBeInTheDocument();
  });
});
