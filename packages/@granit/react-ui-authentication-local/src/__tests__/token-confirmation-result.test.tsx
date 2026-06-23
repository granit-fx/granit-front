import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { TokenConfirmationResult } from '../token-confirmation-result';

import { testI18n } from './test-utils';

import type { ConfirmationStatus } from '../token-confirmation-result';

const PREFIX = 'Auth.ConfirmEmail';

function renderResult(props: {
  status: ConfirmationStatus;
  returnUrl?: string | null;
  isLinkValid?: boolean;
}) {
  const user = userEvent.setup();
  const result = render(
    <MemoryRouter>
      <I18nextProvider i18n={testI18n}>
        <TokenConfirmationResult
          status={props.status}
          i18nPrefix={PREFIX}
          returnUrl={props.returnUrl ?? null}
          isLinkValid={props.isLinkValid ?? true}
        />
      </I18nextProvider>
    </MemoryRouter>
  );
  return { ...result, user };
}

const hrefSpy = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'location', {
    value: { href: '' },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window.location, 'href', { set: hrefSpy, get: () => '' });
});

describe('TokenConfirmationResult', () => {
  it('should render the loading spinner state', () => {
    const { container } = renderResult({ status: 'loading' });
    expect(container.querySelector('[data-slot="public-layout"]')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should render the success state and redirect to a safe returnUrl on click', async () => {
    const { user } = renderResult({ status: 'success', returnUrl: '/connect/authorize' });
    const button = screen.getByRole('button');
    await user.click(button);
    expect(hrefSpy).toHaveBeenCalledWith('/connect/authorize');
  });

  it('should fall back to /login for an unsafe returnUrl on success', async () => {
    const { user } = renderResult({ status: 'success', returnUrl: 'https://evil.tld' });
    await user.click(screen.getByRole('button'));
    expect(hrefSpy).toHaveBeenCalledWith('/login');
  });

  it('should render the generic error message when the link is valid', () => {
    renderResult({ status: 'error', isLinkValid: true });
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  it('should render the invalid-link message when the link is invalid', () => {
    renderResult({ status: 'error', isLinkValid: false });
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });
});
