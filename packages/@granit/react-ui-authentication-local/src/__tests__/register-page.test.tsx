import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { RegisterPage } from '../register-page';

import { testI18n } from './test-utils';

const mockMutateAsync = vi.fn();
const mockAccountSettings = vi.fn();

vi.mock('@granit/react-account', () => ({
  AccountProvider: ({ children }: { children: React.ReactNode }) => children,
  useRegister: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useAccountSettings: () => mockAccountSettings(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockAccountSettings.mockReturnValue({
    data: { allowSelfRegistration: true },
    isLoading: false,
  });
});

function renderPage() {
  const user = userEvent.setup();
  const result = render(
    <MemoryRouter>
      <I18nextProvider i18n={testI18n}>
        <RegisterPage />
      </I18nextProvider>
    </MemoryRouter>
  );
  return { ...result, user };
}

describe('RegisterPage', () => {
  it('should render the registration form', () => {
    renderPage();
    expect(screen.getByText(/create an account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should show email confirmation message on success', async () => {
    mockMutateAsync.mockResolvedValueOnce({
      userId: 'abc-123',
      requiresEmailConfirmation: true,
    });
    const { user } = renderPage();

    await user.type(screen.getByLabelText(/first name/i), 'Marie');
    await user.type(screen.getByLabelText(/last name/i), 'Dupont');
    await user.type(screen.getByLabelText(/email address/i), 'new@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password1!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it('should show error on duplicate email (409)', async () => {
    mockMutateAsync.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 409 },
    });
    const { user } = renderPage();

    await user.type(screen.getByLabelText(/email address/i), 'existing@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password1!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });
  });

  it('should show disabled message when registration returns 403', async () => {
    mockMutateAsync.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 403 },
    });
    const { user } = renderPage();

    await user.type(screen.getByLabelText(/email address/i), 'test@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password1!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/registration disabled/i)).toBeInTheDocument();
    });
  });

  it('should have an "already have account" link', () => {
    renderPage();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('should show disabled page when allowSelfRegistration is false', () => {
    mockAccountSettings.mockReturnValue({
      data: { allowSelfRegistration: false },
      isLoading: false,
    });
    renderPage();
    expect(screen.getByText(/currently disabled/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();
  });

  it('should show skeleton while loading settings', () => {
    mockAccountSettings.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    const { container } = renderPage();
    expect(container.querySelector('[data-slot="public-layout"]')).toBeInTheDocument();
    expect(screen.queryByText(/create an account/i)).not.toBeInTheDocument();
  });
});
