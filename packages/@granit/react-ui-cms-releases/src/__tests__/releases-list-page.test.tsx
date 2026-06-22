import { screen } from '@testing-library/react';

import { ReleasesListPage } from '../releases-list-page';

import { renderCmsReleases } from './test-utils';

vi.mock('@granit/react-cms', () => ({
  useReleases: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  usePublishRelease: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateRelease: () => ({ mutate: vi.fn(), isPending: false }),
  useScheduleRelease: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('ReleasesListPage', () => {
  it('renders the Releases heading', () => {
    renderCmsReleases(<ReleasesListPage />, { route: '/cms/sites/site-1/releases' });
    expect(screen.getByRole('heading', { name: 'Releases' })).toBeInTheDocument();
  });

  it('shows empty state when no releases', () => {
    renderCmsReleases(<ReleasesListPage />, { route: '/cms/sites/site-1/releases' });
    expect(screen.getByText('No releases found.')).toBeInTheDocument();
  });

  it('has the correct data-slot', () => {
    renderCmsReleases(<ReleasesListPage />, { route: '/cms/sites/site-1/releases' });
    expect(document.querySelector('[data-slot="releases-list-page"]')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    renderCmsReleases(<ReleasesListPage />, { route: '/cms/sites/site-1/releases' });
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });
});
