import { mockHostnames } from '@granit/react-hostnames/testing';
import { screen, waitFor } from '@testing-library/react';

import { HostnamesPage } from '../hostnames-page';

import { renderHostnames } from './test-utils';

const { mockUseHostnames } = vi.hoisted(() => ({ mockUseHostnames: vi.fn() }));

vi.mock('@granit/react-hostnames', () => ({
  HostnamesProvider: ({ children }: { children: React.ReactNode }) => children,
  useHostnames: () => mockUseHostnames(),
  useCheckAvailability: () => ({ data: undefined, isFetching: false }),
  useCreateHostname: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useClearPrimary: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteHostname: () => ({ mutate: vi.fn(), isPending: false }),
  useSetPrimary: () => ({ mutate: vi.fn(), isPending: false }),
  useVerifyNow: () => ({ mutate: vi.fn(), isPending: false }),
}));

const { mockHasPermission } = vi.hoisted(() => ({ mockHasPermission: vi.fn() }));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission, isLoading: false }),
}));

const acmeHostnames = mockHostnames.filter((h) => h.host.includes('acme'));

const OWNER_ROUTE = '/hostnames?ownerType=tenant&ownerId=owner-1';

describe('HostnamesPage', () => {
  beforeEach(() => {
    mockHasPermission.mockReturnValue(true);
  });

  afterEach(() => vi.clearAllMocks());

  it('should render the page title and data-slot', () => {
    mockUseHostnames.mockReturnValue({ data: [], isLoading: false, isError: false });
    renderHostnames(<HostnamesPage />);
    expect(document.querySelector('[data-slot="hostnames-page"]')).toBeInTheDocument();
    expect(screen.getAllByText('Hostnames').length).toBeGreaterThanOrEqual(1);
  });

  it('should prompt to select an owner when none is set', () => {
    mockUseHostnames.mockReturnValue({ data: [], isLoading: false, isError: false });
    renderHostnames(<HostnamesPage />);
    expect(screen.getByText('Select an owner to view hostnames.')).toBeInTheDocument();
  });

  it('should render the owner type and id inputs', () => {
    mockUseHostnames.mockReturnValue({ data: [], isLoading: false, isError: false });
    renderHostnames(<HostnamesPage />);
    expect(screen.getByText('Owner type')).toBeInTheDocument();
    expect(screen.getByText('Owner ID')).toBeInTheDocument();
  });

  it('should render hostname rows when an owner is selected', async () => {
    mockUseHostnames.mockReturnValue({ data: acmeHostnames, isLoading: false, isError: false });
    renderHostnames(<HostnamesPage />, { route: OWNER_ROUTE });
    await waitFor(() => {
      expect(screen.getByText('app.acme.com')).toBeInTheDocument();
    });
    expect(screen.getByText('www.acme.com')).toBeInTheDocument();
  });

  it('should render the column headers when an owner is selected', async () => {
    mockUseHostnames.mockReturnValue({ data: acmeHostnames, isLoading: false, isError: false });
    renderHostnames(<HostnamesPage />, { route: OWNER_ROUTE });
    await waitFor(() => {
      expect(screen.getByText('Host')).toBeInTheDocument();
    });
    expect(screen.getByText('Certificate')).toBeInTheDocument();
  });

  it('should render the empty state when an owner has no hostnames', async () => {
    mockUseHostnames.mockReturnValue({ data: [], isLoading: false, isError: false });
    renderHostnames(<HostnamesPage />, { route: OWNER_ROUTE });
    await waitFor(() => {
      expect(screen.getByText('No hostnames configured.')).toBeInTheDocument();
    });
  });

  it('should render the error state when the query fails', async () => {
    mockUseHostnames.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderHostnames(<HostnamesPage />, { route: OWNER_ROUTE });
    await waitFor(() => {
      expect(screen.getByText('Failed to load hostnames.')).toBeInTheDocument();
    });
  });

  it('should show the add-hostname button when the user can manage', async () => {
    mockHasPermission.mockReturnValue(true);
    mockUseHostnames.mockReturnValue({ data: acmeHostnames, isLoading: false, isError: false });
    renderHostnames(<HostnamesPage />, { route: OWNER_ROUTE });
    await waitFor(() => {
      expect(screen.getByText('Add hostname')).toBeInTheDocument();
    });
  });

  it('should hide the add-hostname button when the user cannot manage', async () => {
    mockHasPermission.mockReturnValue(false);
    mockUseHostnames.mockReturnValue({ data: acmeHostnames, isLoading: false, isError: false });
    renderHostnames(<HostnamesPage />, { route: OWNER_ROUTE });
    await waitFor(() => {
      expect(screen.getByText('app.acme.com')).toBeInTheDocument();
    });
    expect(screen.queryByText('Add hostname')).not.toBeInTheDocument();
  });
});
