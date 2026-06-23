import { screen, waitFor } from '@testing-library/react';

import { DeleteAccountPage } from '../delete-account-page';

import { renderWithProviders } from './test-utils';

// ---------------------------------------------------------------------------
// Delete-account error path: a failed deletion flags the password field as
// invalid (the catch branch the happy-path test does not reach).
// ---------------------------------------------------------------------------

const { mockMutateAsync } = vi.hoisted(() => ({
  mockMutateAsync: vi.fn(),
}));

vi.mock('@granit/react-account', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useDeleteAccount: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DeleteAccountPage — error path', () => {
  it('should flag the password field invalid when deletion fails', async () => {
    mockMutateAsync.mockRejectedValue(new Error('wrong password'));
    const { user } = renderWithProviders(<DeleteAccountPage />);

    await user.click(screen.getByRole('button', { name: /delete account/i }));
    const password = await screen.findByLabelText('Current password');
    await user.type(password, 'wrong');
    await user.click(screen.getByRole('button', { name: 'Delete my account' }));

    await waitFor(() => {
      expect(screen.getByText('Incorrect password.')).toBeInTheDocument();
    });
    expect(password).toHaveAttribute('aria-invalid', 'true');
  });

  it('should clear the error flag when the password is edited again', async () => {
    mockMutateAsync.mockRejectedValue(new Error('wrong password'));
    const { user } = renderWithProviders(<DeleteAccountPage />);

    await user.click(screen.getByRole('button', { name: /delete account/i }));
    const password = await screen.findByLabelText('Current password');
    await user.type(password, 'wrong');
    await user.click(screen.getByRole('button', { name: 'Delete my account' }));
    await screen.findByText('Incorrect password.');

    await user.type(password, 'x');
    await waitFor(() => {
      expect(screen.queryByText('Incorrect password.')).not.toBeInTheDocument();
    });
  });
});
