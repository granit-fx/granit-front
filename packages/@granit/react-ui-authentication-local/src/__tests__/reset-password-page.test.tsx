import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { ResetPasswordPage } from '../reset-password-page';

import { testI18n } from './test-utils';

const mockMutateAsync = vi.fn();

vi.mock('@granit/react-account', () => ({
  AccountProvider: ({ children }: { children: React.ReactNode }) => children,
  useResetPassword: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'location', {
    value: { search: '?userId=abc&token=xyz', href: '' },
    writable: true,
  });
});

function renderPage(search?: string) {
  if (search !== undefined) {
    Object.defineProperty(window, 'location', {
      value: { search, href: '' },
      writable: true,
    });
  }
  const user = userEvent.setup();
  const result = render(
    <MemoryRouter>
      <I18nextProvider i18n={testI18n}>
        <ResetPasswordPage />
      </I18nextProvider>
    </MemoryRouter>
  );
  return { ...result, user };
}

describe('ResetPasswordPage', () => {
  it('should render the reset password form with valid params', () => {
    renderPage();
    expect(screen.getByText(/reset your password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('should show error when userId or token is missing', () => {
    renderPage('');
    expect(screen.getByText(/invalid or expired reset link/i)).toBeInTheDocument();
  });

  it('should show success after valid reset', async () => {
    mockMutateAsync.mockResolvedValueOnce(undefined);
    const { user } = renderPage();

    await user.type(screen.getByLabelText(/new password/i), 'NewPass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'NewPass123!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password reset$/i)).toBeInTheDocument();
    });
  });

  it('should show error on invalid token (400)', async () => {
    mockMutateAsync.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 400 },
    });
    const { user } = renderPage();

    await user.type(screen.getByLabelText(/new password/i), 'NewPass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'NewPass123!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/expired or already been used/i)).toBeInTheDocument();
    });
  });
});
