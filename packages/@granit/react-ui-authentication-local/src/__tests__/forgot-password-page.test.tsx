import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import { ForgotPasswordPage } from '../components/forgot-password-page';

import { testI18n } from './test-utils';

const mockMutateAsync = vi.fn();

vi.mock('@granit/react-account', () => ({
  AccountProvider: ({ children }: { children: React.ReactNode }) => children,
  useForgotPassword: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));

beforeEach(() => vi.clearAllMocks());

function renderPage() {
  const user = userEvent.setup();
  const result = render(
    <MemoryRouter>
      <I18nextProvider i18n={testI18n}>
        <ForgotPasswordPage />
      </I18nextProvider>
    </MemoryRouter>
  );
  return { ...result, user };
}

describe('ForgotPasswordPage', () => {
  it('should render the forgot password form', () => {
    renderPage();
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('should show success message after submission', async () => {
    mockMutateAsync.mockResolvedValueOnce(undefined);
    const { user } = renderPage();

    await user.type(screen.getByLabelText(/email address/i), 'admin@test.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it('should show error on rate limit (429)', async () => {
    mockMutateAsync.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 429 },
    });
    const { user } = renderPage();

    await user.type(screen.getByLabelText(/email address/i), 'admin@test.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
    });
  });

  it('should have a back to login link', () => {
    renderPage();
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });
});
