import { screen, waitFor } from '@testing-library/react';

import { renderWithProviders } from '../../__tests__/test-utils';

import { UserPasswordCard } from './user-password-card';

const mockMutate = vi.fn();
const mockSendReset = {
  mutate: mockMutate,
  isPending: false,
  isSuccess: false,
  isError: false,
  reset: vi.fn(),
};

const mockSetTempPassword = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  isSuccess: false,
  isError: false,
  reset: vi.fn(),
};

vi.mock('@granit/react-identity', () => ({
  useSendPasswordResetEmail: () => mockSendReset,
  useSetTemporaryPassword: () => mockSetTempPassword,
}));

describe('UserPasswordCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the password card with reset and temporary password buttons', () => {
    renderWithProviders(<UserPasswordCard userId="user-1" />);

    expect(screen.getByText('Password Management')).toBeInTheDocument();
    expect(screen.getByText('Send reset link')).toBeInTheDocument();
    expect(screen.getByText('Set temporary password')).toBeInTheDocument();
  });

  it('should call send password reset mutation when clicking send reset link', async () => {
    const { user } = renderWithProviders(<UserPasswordCard userId="user-1" />);

    await user.click(screen.getByText('Send reset link'));

    expect(mockMutate).toHaveBeenCalledWith('user-1');
  });

  it('should display success message after reset email is sent', () => {
    mockSendReset.isSuccess = true;

    renderWithProviders(<UserPasswordCard userId="user-1" />);

    expect(screen.getByText('Reset email sent successfully')).toBeInTheDocument();

    mockSendReset.isSuccess = false;
  });

  it('should open the temporary password dialog when clicking set temporary password', async () => {
    const { user } = renderWithProviders(<UserPasswordCard userId="user-1" />);

    await user.click(screen.getByText('Set temporary password'));

    await waitFor(() => {
      expect(screen.getByLabelText('Temporary password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm temporary password')).toBeInTheDocument();
    });
  });

  it('shows the loading label and disables the reset button while the reset is pending', () => {
    mockSendReset.isPending = true;
    renderWithProviders(<UserPasswordCard userId="user-1" />);
    expect(screen.getByRole('button', { name: 'Loading...' })).toBeDisabled();
    mockSendReset.isPending = false;
  });

  it('shows the temporary-password-set success message after a successful set', () => {
    mockSetTempPassword.isSuccess = true;
    renderWithProviders(<UserPasswordCard userId="user-1" />);
    expect(screen.getByText('Temporary password set successfully')).toBeInTheDocument();
    mockSetTempPassword.isSuccess = false;
  });

  it('keeps the confirm button disabled until a valid, matching password is entered', async () => {
    const { user } = renderWithProviders(<UserPasswordCard userId="user-1" />);
    await user.click(screen.getByText('Set temporary password'));

    const confirm = await screen.findByRole('button', { name: 'Confirm' });
    expect(confirm).toBeDisabled();

    // Too short → still disabled, no mismatch warning yet (confirm empty).
    await user.type(screen.getByLabelText('Temporary password'), 'short');
    expect(confirm).toBeDisabled();
  });

  it('shows the mismatch warning and keeps confirm disabled when passwords differ', async () => {
    const { user } = renderWithProviders(<UserPasswordCard userId="user-1" />);
    await user.click(screen.getByText('Set temporary password'));

    await user.type(screen.getByLabelText('Temporary password'), 'longenough1');
    await user.type(screen.getByLabelText('Confirm temporary password'), 'different1');

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
  });

  it('submits a valid matching password and closes the dialog', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockSetTempPassword.mutateAsync = mutateAsync;
    const { user } = renderWithProviders(<UserPasswordCard userId="user-1" />);
    await user.click(screen.getByText('Set temporary password'));

    await user.type(screen.getByLabelText('Temporary password'), 'longenough1');
    await user.type(screen.getByLabelText('Confirm temporary password'), 'longenough1');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ userId: 'user-1', password: 'longenough1' });
    });
  });

  it('keeps the dialog open when the set-temporary mutation rejects', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('boom'));
    mockSetTempPassword.mutateAsync = mutateAsync;
    const { user } = renderWithProviders(<UserPasswordCard userId="user-1" />);
    await user.click(screen.getByText('Set temporary password'));

    await user.type(screen.getByLabelText('Temporary password'), 'longenough1');
    await user.type(screen.getByLabelText('Confirm temporary password'), 'longenough1');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    // The dialog stays open: its inputs remain mounted.
    expect(screen.getByLabelText('Temporary password')).toBeInTheDocument();
  });

  it('renders the set error message when the mutation is in an error state', async () => {
    mockSetTempPassword.isError = true;
    const { user } = renderWithProviders(<UserPasswordCard userId="user-1" />);
    await user.click(screen.getByText('Set temporary password'));

    expect(await screen.findByText('Failed to set password')).toBeInTheDocument();
    mockSetTempPassword.isError = false;
  });

  it('closes the dialog via the cancel button', async () => {
    const { user } = renderWithProviders(<UserPasswordCard userId="user-1" />);
    await user.click(screen.getByText('Set temporary password'));
    await screen.findByLabelText('Temporary password');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(screen.queryByLabelText('Temporary password')).not.toBeInTheDocument();
    });
  });
});
