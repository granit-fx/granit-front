import { mockHostnames } from '@granit/react-cms-hostnames/testing';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HostnamesPage } from '../components/hostnames-page';

import { renderCmsHostnames } from './test-utils';

// Stub the headless data layer. `useSiteHostnames` returns a BARE ARRAY (not a
// paged envelope); the mutations expose `{ mutate, isPending }`.
vi.mock('@granit/react-cms-hostnames', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useSiteHostnames: () => ({ data: mockHostnames, isLoading: false, isError: false }),
    useAddSiteHostname: () => ({ mutate: vi.fn(), isPending: false }),
    useRemoveSiteHostname: () => ({ mutate: vi.fn(), isPending: false }),
    useVerifySiteHostname: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

vi.mock('@granit/react-localization', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useDateFormatter: () => ({
      formatDate: (d: string) => d,
      formatDateTime: (d: string) => d,
      formatTimeAgo: (d: string) => d,
    }),
  };
});

describe('HostnamesPage', () => {
  it('renders the Hostnames heading and data-slot', () => {
    renderCmsHostnames(<HostnamesPage />, { route: '/cms/sites/site-1/hostnames' });
    expect(screen.getByRole('heading', { name: 'Hostnames' })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="hostnames-page"]')).toBeInTheDocument();
  });

  it('renders the mocked hostname rows', () => {
    renderCmsHostnames(<HostnamesPage />, { route: '/cms/sites/site-1/hostnames' });
    expect(screen.getByText(mockHostnames[0].host)).toBeInTheDocument();
    expect(screen.getByText(mockHostnames[1].host)).toBeInTheDocument();
  });
});
