import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import { ResetPasswordPage } from '../components/reset-password-page';

import { testI18n } from './test-utils';

const mockMutateAsync = vi.fn();

vi.mock('@granit/react-account', () => ({
  AccountProvider: ({ children }: { children: React.ReactNode }) => children,
  useResetPassword: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));

const hrefSpy = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'location', {
    value: { search: '?userId=abc&token=xyz', href: '' },
    writable: true,
  });
  Object.defineProperty(window.location, 'href', { set: hrefSpy, get: () => '' });
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

  it('should show a generic error on an unexpected (500) failure', async () => {
    mockMutateAsync.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 500 },
    });
    const { user } = renderPage();

    await user.type(screen.getByLabelText(/new password/i), 'NewPass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'NewPass123!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  it('should redirect to a safe returnUrl after a successful reset', async () => {
    mockMutateAsync.mockResolvedValueOnce(undefined);
    const { user } = renderPage('?userId=abc&token=xyz&returnUrl=/connect/authorize');
    Object.defineProperty(window.location, 'href', { set: hrefSpy, get: () => '' });

    await user.type(screen.getByLabelText(/new password/i), 'NewPass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'NewPass123!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password reset$/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /sign in with your new password/i }));
    expect(hrefSpy).toHaveBeenCalledWith('/connect/authorize');
  });
});
