import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SeoDashboardPage } from '../components/seo-dashboard-page';

import { renderCmsSeo } from './test-utils';

// The page consumes the @granit/react-cms-seo hooks directly; stub them to a
// minimal "empty + idle" shape so only the visual layer is under test. The host
// supplies a CmsSeoProvider (and the Axios client) in production — none needed here.
vi.mock('@granit/react-cms-seo', () => ({
  useCmsSeoConfig: () => ({ client: {}, basePath: '/api/cms/seo' }),
  useSeoDefaults: () => ({ data: undefined, isLoading: false }),
  useUpdateSeoDefaults: () => ({ mutate: vi.fn(), isPending: false }),
  useSeoMetadataMeta: () => ({ data: undefined, isLoading: false }),
  useSeoSuggestions: () => ({ data: { items: [] }, isLoading: false }),
  useApplySeoSuggestion: () => ({ mutate: vi.fn(), isPending: false }),
  useRejectSeoSuggestion: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('SeoDashboardPage', () => {
  it('renders the page title', () => {
    renderCmsSeo(<SeoDashboardPage />);
    expect(screen.getByText('SEO')).toBeInTheDocument();
  });

  it('renders the page subtitle', () => {
    renderCmsSeo(<SeoDashboardPage />);
    expect(
      screen.getByText('Manage SEO defaults, audit issues, and AI suggestions.')
    ).toBeInTheDocument();
  });

  it('renders the Defaults tab trigger', () => {
    renderCmsSeo(<SeoDashboardPage />);
    expect(screen.getByRole('tab', { name: 'Defaults' })).toBeInTheDocument();
  });

  it('renders the Audit tab trigger', () => {
    renderCmsSeo(<SeoDashboardPage />);
    expect(screen.getByRole('tab', { name: 'Audit' })).toBeInTheDocument();
  });

  it('renders the AI Inbox tab trigger', () => {
    renderCmsSeo(<SeoDashboardPage />);
    expect(screen.getByRole('tab', { name: 'AI Inbox' })).toBeInTheDocument();
  });

  it('has the correct data-slot', () => {
    renderCmsSeo(<SeoDashboardPage />);
    expect(document.querySelector('[data-slot="seo-dashboard-page"]')).toBeInTheDocument();
  });

  it('shows the Defaults tab form by default', () => {
    renderCmsSeo(<SeoDashboardPage />);
    expect(screen.getByText('Title template')).toBeInTheDocument();
  });

  it('shows Save button in the defaults tab', () => {
    renderCmsSeo(<SeoDashboardPage />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});
