import { screen, waitFor } from '@testing-library/react';

import { ChangeEmailPage } from '../change-email-page';

import { renderWithProviders } from './test-utils';

const mockMutateAsync = vi.fn();

vi.mock('@granit/react-account', () => ({
  AccountProvider: ({ children }: { children: React.ReactNode }) => children,
  useChangeEmail: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ChangeEmailPage', () => {
  it('should render the title and subtitle', () => {
    renderWithProviders(<ChangeEmailPage />);
    expect(screen.getByText('Change email address')).toBeInTheDocument();
    expect(
      screen.getByText('Update the email address associated with your account.')
    ).toBeInTheDocument();
  });

  it('should render the change-email form with both fields', () => {
    renderWithProviders(<ChangeEmailPage />);
    expect(screen.getByLabelText('New email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Current password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send confirmation' })).toBeInTheDocument();
  });

  it('should expose the page data-slot', () => {
    renderWithProviders(<ChangeEmailPage />);
    expect(document.querySelector('[data-slot="change-email-page"]')).toBeInTheDocument();
  });

  it('should submit the new email and current password', async () => {
    mockMutateAsync.mockResolvedValueOnce(undefined);
    const { user } = renderWithProviders(<ChangeEmailPage />);

    await user.type(screen.getByLabelText('New email address'), 'new@example.com');
    await user.type(screen.getByLabelText('Current password'), 'CurrentPass123!');
    await user.click(screen.getByRole('button', { name: 'Send confirmation' }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        newEmail: 'new@example.com',
        currentPassword: 'CurrentPass123!',
      });
    });
  });

  it('should show the success state after a successful change', async () => {
    mockMutateAsync.mockResolvedValueOnce(undefined);
    const { user } = renderWithProviders(<ChangeEmailPage />);

    await user.type(screen.getByLabelText('New email address'), 'new@example.com');
    await user.type(screen.getByLabelText('Current password'), 'CurrentPass123!');
    await user.click(screen.getByRole('button', { name: 'Send confirmation' }));

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Change to a different email' })).toBeInTheDocument();
  });

  it('should not submit when fields are empty', async () => {
    const { user } = renderWithProviders(<ChangeEmailPage />);

    await user.click(screen.getByRole('button', { name: 'Send confirmation' }));

    await waitFor(() => {
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });
});
