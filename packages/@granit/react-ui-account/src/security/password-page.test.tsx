import { screen } from '@testing-library/react';

import { renderWithProviders } from '../__tests__/test-utils';

import { PasswordPage } from './password-page';

const { mockMutateAsync } = vi.hoisted(() => ({
  mockMutateAsync: vi.fn(),
}));

vi.mock('@granit/react-account', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useChangePassword: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PasswordPage', () => {
  it('should render the page title and the change-password form fields', () => {
    renderWithProviders(<PasswordPage />);

    expect(document.querySelector('[data-slot="password-page"]')).toBeInTheDocument();
    // "Change password" is both the page heading and the submit button label.
    expect(screen.getByRole('heading', { name: 'Change password' })).toBeInTheDocument();
    expect(screen.getByText('Update your account password')).toBeInTheDocument();
    expect(screen.getByLabelText('Current password')).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toBeInTheDocument();
  });

  it('should toggle the current-password visibility when the eye button is clicked', async () => {
    const { user } = renderWithProviders(<PasswordPage />);

    const input = screen.getByLabelText('Current password');
    expect(input).toHaveAttribute('type', 'password');

    // Both fields expose a "Show password" toggle; the first one is the current-password field.
    await user.click(screen.getAllByRole('button', { name: 'Show password' })[0]);
    expect(input).toHaveAttribute('type', 'text');
  });

  it('should submit the change-password mutation with the entered values', async () => {
    mockMutateAsync.mockResolvedValue(undefined);
    const { user } = renderWithProviders(<PasswordPage />);

    await user.type(screen.getByLabelText('Current password'), 'old-pass');
    await user.type(screen.getByLabelText('New password'), 'new-pass');
    await user.click(screen.getByRole('button', { name: 'Change password' }));

    expect(mockMutateAsync).toHaveBeenCalledWith({
      currentPassword: 'old-pass',
      newPassword: 'new-pass',
    });
  });
});
