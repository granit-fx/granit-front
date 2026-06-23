import { screen } from '@testing-library/react';

import { renderWithProviders } from '../__tests__/test-utils';

import { PasskeysPage } from './passkeys-page';

import type { AccountPasskeyInfo, PasskeyId } from '@granit/account';

// ---------------------------------------------------------------------------
// Stub the passkey data + registration mutations.
// ---------------------------------------------------------------------------

const { mockUsePasskeys } = vi.hoisted(() => ({
  mockUsePasskeys: vi.fn(),
}));

vi.mock('@granit/react-account', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    usePasskeys: mockUsePasskeys,
    useBeginPasskeyRegistration: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useCompletePasskeyRegistration: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDeletePasskey: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useRenamePasskey: () => ({ mutateAsync: vi.fn(), isPending: false }),
  };
});

const mockPasskey: AccountPasskeyInfo = {
  id: 'pk-1' as PasskeyId,
  name: 'Work laptop',
  createdAt: '2026-01-01T10:00:00Z' as AccountPasskeyInfo['createdAt'],
  lastUsedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  // WebAuthn is available in this browser → enables the "Add passkey" action.
  vi.stubGlobal('PublicKeyCredential', function PublicKeyCredential() {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PasskeysPage', () => {
  it('should render the page header and the list card', () => {
    mockUsePasskeys.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<PasskeysPage />);

    expect(document.querySelector('[data-slot="passkeys-page"]')).toBeInTheDocument();
    expect(screen.getByText('Passkeys')).toBeInTheDocument();
    expect(screen.getByText('Registered passkeys')).toBeInTheDocument();
  });

  it('should show the empty state when no passkeys are registered', () => {
    mockUsePasskeys.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<PasskeysPage />);

    expect(screen.getByText('No passkeys registered')).toBeInTheDocument();
  });

  it('should render a registered passkey with rename and delete actions', () => {
    mockUsePasskeys.mockReturnValue({ data: [mockPasskey], isLoading: false });
    renderWithProviders(<PasskeysPage />);

    expect(screen.getByText('Work laptop')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rename' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('should open the inline register form when Add passkey is clicked', async () => {
    mockUsePasskeys.mockReturnValue({ data: [], isLoading: false });
    const { user } = renderWithProviders(<PasskeysPage />);

    await user.click(screen.getByRole('button', { name: /add passkey/i }));

    expect(screen.getByText('Register a new passkey')).toBeInTheDocument();
    expect(screen.getByLabelText('Name (optional)')).toBeInTheDocument();
  });

  it('should warn that passkeys are unsupported when the browser lacks WebAuthn', () => {
    vi.unstubAllGlobals();
    vi.stubGlobal('PublicKeyCredential', undefined);
    mockUsePasskeys.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<PasskeysPage />);

    expect(screen.getByText('Passkeys not supported in this browser')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add passkey/i })).not.toBeInTheDocument();
  });
});
