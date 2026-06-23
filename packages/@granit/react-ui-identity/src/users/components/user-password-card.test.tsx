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
});
