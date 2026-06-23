import { screen, waitFor } from '@testing-library/react';

import { DeleteAccountPage } from '../delete-account-page';

import { renderWithProviders } from './test-utils';

// ---------------------------------------------------------------------------
// Stub the delete-account mutation. The host sign-out is injected via the
// `onDeleted` prop, so only the SDK hook needs mocking.
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

describe('DeleteAccountPage', () => {
  it('should render the danger-zone page with the warning alert', () => {
    renderWithProviders(<DeleteAccountPage />);

    expect(document.querySelector('[data-slot="delete-account-page"]')).toBeInTheDocument();
    expect(screen.getByText('Danger zone')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Deleting your account is permanent and cannot be reversed. All your data will be erased.'
      )
    ).toBeInTheDocument();
  });

  it('should not show the confirm dialog until the delete button is clicked', () => {
    renderWithProviders(<DeleteAccountPage />);
    expect(
      screen.queryByText('This action cannot be undone. Enter your password to confirm.')
    ).not.toBeInTheDocument();
  });

  it('should open the confirm dialog with a password field', async () => {
    const { user } = renderWithProviders(<DeleteAccountPage />);

    await user.click(screen.getByRole('button', { name: /delete account/i }));

    await waitFor(() => {
      expect(
        screen.getByText('This action cannot be undone. Enter your password to confirm.')
      ).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Current password')).toBeInTheDocument();
  });

  it('should keep the confirm button disabled until a password is entered', async () => {
    const { user } = renderWithProviders(<DeleteAccountPage />);

    await user.click(screen.getByRole('button', { name: /delete account/i }));

    const confirmButton = await screen.findByRole('button', { name: 'Delete my account' });
    expect(confirmButton).toBeDisabled();

    await user.type(screen.getByLabelText('Current password'), 'hunter2');
    expect(confirmButton).toBeEnabled();
  });

  it('should call the delete mutation with the entered password', async () => {
    mockMutateAsync.mockResolvedValue(undefined);
    const { user } = renderWithProviders(<DeleteAccountPage />);

    await user.click(screen.getByRole('button', { name: /delete account/i }));
    await user.type(await screen.findByLabelText('Current password'), 'hunter2');
    await user.click(screen.getByRole('button', { name: 'Delete my account' }));

    expect(mockMutateAsync).toHaveBeenCalledWith({ password: 'hunter2' });
  });

  it('should invoke onDeleted after a successful deletion', async () => {
    mockMutateAsync.mockResolvedValue(undefined);
    const onDeleted = vi.fn();
    const { user } = renderWithProviders(<DeleteAccountPage onDeleted={onDeleted} />);

    await user.click(screen.getByRole('button', { name: /delete account/i }));
    await user.type(await screen.findByLabelText('Current password'), 'hunter2');
    await user.click(screen.getByRole('button', { name: 'Delete my account' }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
  });
});
