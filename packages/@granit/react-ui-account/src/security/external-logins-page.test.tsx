import { screen } from '@testing-library/react';

import { renderWithProviders } from '../__tests__/test-utils';

import { ExternalLoginsPage } from './external-logins-page';

import type { AccountExternalLoginInfo } from '@granit/account';

// ---------------------------------------------------------------------------
// Stub the external-login data + unlink mutation, the available-providers hook,
// and the (separately-tested) ExternalLoginButtons / provider-icon children.
// ---------------------------------------------------------------------------

const { mockUseExternalLogins, mockUnlink, mockUseAvailableProviders } = vi.hoisted(() => ({
  mockUseExternalLogins: vi.fn(),
  mockUnlink: vi.fn(),
  mockUseAvailableProviders: vi.fn(),
}));

vi.mock('@granit/react-account', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useExternalLogins: mockUseExternalLogins,
    useUnlinkExternalLogin: () => ({ mutateAsync: mockUnlink, isPending: false }),
  };
});

vi.mock('./use-available-external-providers', () => ({
  useAvailableExternalProviders: mockUseAvailableProviders,
}));

vi.mock('@granit/react-ui-authentication-local', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    ExternalLoginButtons: () => <div data-testid="external-login-buttons" />,
    ExternalProviderIcon: () => <svg data-testid="provider-icon" />,
  };
});

const googleLogin: AccountExternalLoginInfo = {
  loginProvider: 'Google',
  providerKey: 'google-user-123',
  providerDisplayName: 'Google',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAvailableProviders.mockReturnValue({
    providers: [
      { name: 'Google', displayName: 'Google', type: 'google' },
      { name: 'GitHub', displayName: 'GitHub', type: 'github' },
    ],
  });
});

describe('ExternalLoginsPage', () => {
  it('should render the page header and section cards', () => {
    mockUseExternalLogins.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<ExternalLoginsPage />);

    expect(document.querySelector('[data-slot="external-logins-page"]')).toBeInTheDocument();
    expect(screen.getByText('External accounts')).toBeInTheDocument();
    expect(screen.getByText('Linked accounts')).toBeInTheDocument();
    expect(screen.getByText('Link a new provider')).toBeInTheDocument();
  });

  it('should show the empty state when no providers are linked', () => {
    mockUseExternalLogins.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<ExternalLoginsPage />);

    expect(screen.getByText('No external accounts linked')).toBeInTheDocument();
    // An unlinked provider remains → link buttons render.
    expect(screen.getByTestId('external-login-buttons')).toBeInTheDocument();
  });

  it('should render a linked account with its unlink action', () => {
    mockUseExternalLogins.mockReturnValue({ data: [googleLogin], isLoading: false });
    renderWithProviders(<ExternalLoginsPage />);

    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('google-user-123')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unlink' })).toBeInTheDocument();
  });

  it('should call the unlink mutation with the provider scheme', async () => {
    mockUnlink.mockResolvedValue(undefined);
    mockUseExternalLogins.mockReturnValue({ data: [googleLogin], isLoading: false });
    const { user } = renderWithProviders(<ExternalLoginsPage />);

    await user.click(screen.getByRole('button', { name: 'Unlink' }));

    expect(mockUnlink).toHaveBeenCalledWith('Google');
  });

  it('should show the all-linked message when every provider is already linked', () => {
    mockUseAvailableProviders.mockReturnValue({
      providers: [{ name: 'Google', displayName: 'Google', type: 'google' }],
    });
    mockUseExternalLogins.mockReturnValue({ data: [googleLogin], isLoading: false });
    renderWithProviders(<ExternalLoginsPage />);

    expect(screen.getByText('All available providers are already linked.')).toBeInTheDocument();
    expect(screen.queryByTestId('external-login-buttons')).not.toBeInTheDocument();
  });
});
