import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import { FederatedLoginPage } from '../federated-login-page';

import { testI18n } from './test-utils';

import type { ReactElement } from 'react';

function renderPage(ui: ReactElement, route = '/login') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <I18nextProvider i18n={testI18n}>{ui}</I18nextProvider>
    </MemoryRouter>
  );
}

describe('FederatedLoginPage', () => {
  it('renders the subtitle and sign-in button, and calls login on click', async () => {
    const login = vi.fn();
    renderPage(<FederatedLoginPage login={login} loading={false} authenticated={false} />);
    expect(screen.getByText(/Sign in with your administrator account/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(login).toHaveBeenCalledOnce();
  });

  it('disables the button and shows signing-in text while loading', () => {
    renderPage(<FederatedLoginPage login={vi.fn()} loading authenticated={false} />);
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('surfaces the auth error from the ?error= query param', () => {
    renderPage(
      <FederatedLoginPage login={vi.fn()} loading={false} authenticated={false} />,
      '/login?error=server_error'
    );
    expect(screen.getByText(/authentication server encountered an error/i)).toBeInTheDocument();
  });

  it('falls back to the generic access-denied message for an unknown error code', () => {
    renderPage(
      <FederatedLoginPage login={vi.fn()} loading={false} authenticated={false} />,
      '/login?error=__not_a_real_code__'
    );
    expect(screen.getByText(/your login request was denied/i)).toBeInTheDocument();
  });

  it('redirects away when already authenticated (no sign-in button)', () => {
    renderPage(<FederatedLoginPage login={vi.fn()} loading={false} authenticated />);
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
  });
});
