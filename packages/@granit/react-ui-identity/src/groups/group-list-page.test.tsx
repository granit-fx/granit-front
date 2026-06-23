import { screen } from '@testing-library/react';

import { renderWithProviders } from '../__tests__/test-utils';

import { GroupListPage } from './group-list-page';

import type { IdentityGroup, IdentityProviderCapabilitiesResponse } from '@granit/identity';

const mockGroups: IdentityGroup[] = [
  { id: 'grp-1', name: 'Administrators', path: '/administrators', subGroups: [] },
  { id: 'grp-2', name: 'Support', path: '/support', subGroups: [] },
];

let mockCapabilities: IdentityProviderCapabilitiesResponse | undefined;

vi.mock('@granit/react-identity', () => ({
  useGroups: () => ({ data: mockGroups, isLoading: false, error: null }),
  useIdentityCapabilities: () => ({ data: mockCapabilities }),
}));

function buildCapabilities(
  overrides: Partial<IdentityProviderCapabilitiesResponse> = {}
): IdentityProviderCapabilitiesResponse {
  return {
    providerName: 'Keycloak',
    supportsIndividualSessionTermination: true,
    supportsNativePasswordResetEmail: true,
    supportsGroupHierarchy: true,
    supportsCustomAttributes: true,
    maxCustomAttributes: 20,
    supportsCredentialVerification: true,
    supportsUserCreation: true,
    supportsGroupManagement: false,
    ...overrides,
  };
}

describe('GroupListPage', () => {
  beforeEach(() => {
    mockCapabilities = undefined;
  });

  it('renders the group list', () => {
    mockCapabilities = buildCapabilities();
    renderWithProviders(<GroupListPage />);
    expect(screen.getByText('Administrators')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
  });

  it('shows the lifecycle notice when the provider does not support group management', () => {
    mockCapabilities = buildCapabilities({ supportsGroupManagement: false });
    renderWithProviders(<GroupListPage />);
    expect(screen.getByText('Group lifecycle managed by identity provider')).toBeInTheDocument();
  });

  it('hides the lifecycle notice when the provider supports group management', () => {
    mockCapabilities = buildCapabilities({ supportsGroupManagement: true });
    renderWithProviders(<GroupListPage />);
    expect(
      screen.queryByText('Group lifecycle managed by identity provider')
    ).not.toBeInTheDocument();
  });

  it('hides the lifecycle notice while capabilities are still loading', () => {
    mockCapabilities = undefined;
    renderWithProviders(<GroupListPage />);
    expect(
      screen.queryByText('Group lifecycle managed by identity provider')
    ).not.toBeInTheDocument();
  });
});
