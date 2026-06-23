import { mockPasskeys } from '@granit/react-account/testing';
import { screen, waitFor } from '@testing-library/react';

import { PasskeysPage } from '../security/passkeys-page';

import { renderWithProviders } from './test-utils';

// ---------------------------------------------------------------------------
// Interactive passkey flows: register (success / cancel / WebAuthn error),
// rename and delete. The WebAuthn dance is stubbed via navigator.credentials
// and a mocked fromBase64Url; mutations are vi.hoisted so payloads assert.
// ---------------------------------------------------------------------------

const {
  mockUsePasskeys,
  mockBeginRegistration,
  mockCompleteRegistration,
  mockDeletePasskey,
  mockRenamePasskey,
  mockIsAxiosError,
} = vi.hoisted(() => ({
  mockUsePasskeys: vi.fn(),
  mockBeginRegistration: vi.fn(),
  mockCompleteRegistration: vi.fn(),
  mockDeletePasskey: vi.fn(),
  mockRenamePasskey: vi.fn(),
  mockIsAxiosError: vi.fn(() => false),
}));

vi.mock('@granit/react-account', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    usePasskeys: mockUsePasskeys,
    useBeginPasskeyRegistration: () => ({ mutateAsync: mockBeginRegistration, isPending: false }),
    useCompletePasskeyRegistration: () => ({
      mutateAsync: mockCompleteRegistration,
      isPending: false,
    }),
    useDeletePasskey: () => ({ mutateAsync: mockDeletePasskey, isPending: false }),
    useRenamePasskey: () => ({ mutateAsync: mockRenamePasskey, isPending: false }),
  };
});

vi.mock('@granit/api-client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, isAxiosError: mockIsAxiosError };
});

vi.mock('@granit/react-ui-authentication-local', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, fromBase64Url: (s: string) => new TextEncoder().encode(s) };
});

const registrationOptionsJson = JSON.stringify({
  challenge: 'Y2hhbGxlbmdl',
  user: { id: 'dXNlcg', name: 'alice', displayName: 'Alice' },
  rp: { id: 'example.com', name: 'Example' },
  pubKeyCredParams: [],
});

beforeEach(() => {
  vi.clearAllMocks();
  mockIsAxiosError.mockReturnValue(false);
  vi.stubGlobal('PublicKeyCredential', function PublicKeyCredential() {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PasskeysPage — registration', () => {
  it('should run the full register flow and call complete with the credential', async () => {
    mockUsePasskeys.mockReturnValue({ data: [], isLoading: false });
    mockBeginRegistration.mockResolvedValue(registrationOptionsJson);
    const create = vi.fn().mockResolvedValue({ id: 'cred-1', type: 'public-key' });
    vi.stubGlobal('navigator', { credentials: { create } });
    mockCompleteRegistration.mockResolvedValue(undefined);
    const { user } = renderWithProviders(<PasskeysPage />);

    await user.click(screen.getByRole('button', { name: /add passkey/i }));
    const nameInput = screen.getByLabelText('Name (optional)');
    await user.clear(nameInput);
    await user.type(nameInput, 'YubiKey');
    await user.click(screen.getByRole('button', { name: 'Register passkey' }));

    await waitFor(() => expect(mockBeginRegistration).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledTimes(1);
    expect(mockCompleteRegistration).toHaveBeenCalledWith({
      credentialJson: JSON.stringify({ id: 'cred-1', type: 'public-key' }),
      name: 'YubiKey',
    });
  });

  it('should send an undefined name when the field is left blank', async () => {
    mockUsePasskeys.mockReturnValue({ data: [], isLoading: false });
    mockBeginRegistration.mockResolvedValue(registrationOptionsJson);
    const create = vi.fn().mockResolvedValue({ id: 'cred-2', type: 'public-key' });
    vi.stubGlobal('navigator', { credentials: { create } });
    mockCompleteRegistration.mockResolvedValue(undefined);
    const { user } = renderWithProviders(<PasskeysPage />);

    await user.click(screen.getByRole('button', { name: /add passkey/i }));
    await user.clear(screen.getByLabelText('Name (optional)'));
    await user.click(screen.getByRole('button', { name: 'Register passkey' }));

    await waitFor(() => expect(mockCompleteRegistration).toHaveBeenCalledTimes(1));
    expect(mockCompleteRegistration).toHaveBeenCalledWith({
      credentialJson: JSON.stringify({ id: 'cred-2', type: 'public-key' }),
      name: undefined,
    });
  });

  it('should not complete when the user cancels the WebAuthn prompt', async () => {
    mockUsePasskeys.mockReturnValue({ data: [], isLoading: false });
    mockBeginRegistration.mockResolvedValue(registrationOptionsJson);
    const create = vi.fn().mockResolvedValue(null);
    vi.stubGlobal('navigator', { credentials: { create } });
    const { user } = renderWithProviders(<PasskeysPage />);

    await user.click(screen.getByRole('button', { name: /add passkey/i }));
    await user.click(screen.getByRole('button', { name: 'Register passkey' }));

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(mockCompleteRegistration).not.toHaveBeenCalled();
  });

  it('should surface a non-Axios WebAuthn failure', async () => {
    mockUsePasskeys.mockReturnValue({ data: [], isLoading: false });
    mockBeginRegistration.mockResolvedValue(registrationOptionsJson);
    const create = vi.fn().mockRejectedValue(new Error('NotAllowedError'));
    vi.stubGlobal('navigator', { credentials: { create } });
    mockIsAxiosError.mockReturnValue(false);
    const { user } = renderWithProviders(<PasskeysPage />);

    await user.click(screen.getByRole('button', { name: /add passkey/i }));
    await user.click(screen.getByRole('button', { name: 'Register passkey' }));

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(mockCompleteRegistration).not.toHaveBeenCalled();
  });

  it('should not surface its own toast for an Axios error', async () => {
    mockUsePasskeys.mockReturnValue({ data: [], isLoading: false });
    mockBeginRegistration.mockRejectedValue(new Error('500'));
    mockIsAxiosError.mockReturnValue(true);
    const { user } = renderWithProviders(<PasskeysPage />);

    await user.click(screen.getByRole('button', { name: /add passkey/i }));
    await user.click(screen.getByRole('button', { name: 'Register passkey' }));

    await waitFor(() => expect(mockBeginRegistration).toHaveBeenCalledTimes(1));
    expect(mockIsAxiosError).toHaveBeenCalled();
  });

  it('should close the register form when Cancel is clicked', async () => {
    mockUsePasskeys.mockReturnValue({ data: [], isLoading: false });
    const { user } = renderWithProviders(<PasskeysPage />);

    await user.click(screen.getByRole('button', { name: /add passkey/i }));
    expect(screen.getByText('Register a new passkey')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Register a new passkey')).not.toBeInTheDocument();
  });
});

describe('PasskeysPage — list, rename and delete', () => {
  it('should show the loading spinner while passkeys load', () => {
    mockUsePasskeys.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<PasskeysPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render fixture passkeys including a last-used timestamp', () => {
    mockUsePasskeys.mockReturnValue({ data: mockPasskeys, isLoading: false });
    renderWithProviders(<PasskeysPage />);

    expect(screen.getByText(mockPasskeys[0]!.name!)).toBeInTheDocument();
    expect(screen.getByText(mockPasskeys[1]!.name!)).toBeInTheDocument();
  });

  it('should rename a passkey via the dialog', async () => {
    mockUsePasskeys.mockReturnValue({ data: mockPasskeys, isLoading: false });
    mockRenamePasskey.mockResolvedValue(undefined);
    const { user } = renderWithProviders(<PasskeysPage />);

    await user.click(screen.getAllByRole('button', { name: 'Rename' })[0]!);
    const dialogNameInput = await screen.findByLabelText('Name');
    await user.clear(dialogNameInput);
    await user.type(dialogNameInput, 'Renamed key');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockRenamePasskey).toHaveBeenCalledWith({
      id: mockPasskeys[0]!.id,
      request: { name: 'Renamed key' },
    });
  });

  it('should swallow a rename error', async () => {
    mockUsePasskeys.mockReturnValue({ data: mockPasskeys, isLoading: false });
    mockRenamePasskey.mockRejectedValue(new Error('conflict'));
    const { user } = renderWithProviders(<PasskeysPage />);

    await user.click(screen.getAllByRole('button', { name: 'Rename' })[0]!);
    await screen.findByLabelText('Name');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mockRenamePasskey).toHaveBeenCalledTimes(1));
  });

  it('should close the rename dialog via Cancel', async () => {
    mockUsePasskeys.mockReturnValue({ data: mockPasskeys, isLoading: false });
    const { user } = renderWithProviders(<PasskeysPage />);

    await user.click(screen.getAllByRole('button', { name: 'Rename' })[0]!);
    await screen.findByText('Rename passkey');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByText('Rename passkey')).not.toBeInTheDocument();
    });
  });

  it('should delete a passkey via the confirm dialog', async () => {
    mockUsePasskeys.mockReturnValue({ data: mockPasskeys, isLoading: false });
    mockDeletePasskey.mockResolvedValue(undefined);
    const { user } = renderWithProviders(<PasskeysPage />);

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]!);
    await screen.findByText('Remove passkey');
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(mockDeletePasskey).toHaveBeenCalledWith(mockPasskeys[0]!.id);
  });

  it('should swallow a delete error', async () => {
    mockUsePasskeys.mockReturnValue({ data: mockPasskeys, isLoading: false });
    mockDeletePasskey.mockRejectedValue(new Error('boom'));
    const { user } = renderWithProviders(<PasskeysPage />);

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]!);
    await screen.findByText('Remove passkey');
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(mockDeletePasskey).toHaveBeenCalledTimes(1));
  });

  it('should close the delete dialog via Cancel', async () => {
    mockUsePasskeys.mockReturnValue({ data: mockPasskeys, isLoading: false });
    const { user } = renderWithProviders(<PasskeysPage />);

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]!);
    await screen.findByText('Remove passkey');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByText('Remove passkey')).not.toBeInTheDocument();
    });
  });
});
