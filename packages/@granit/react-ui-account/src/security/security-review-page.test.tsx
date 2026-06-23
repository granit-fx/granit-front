import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { testI18n } from '../__tests__/test-utils';

import { SecurityReviewPage } from './security-review-page';

import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Mock the anonymous session-review hooks. Reassign `contextState` /
// `submitState` per test before rendering. `mutateSpy` captures the committed
// decision so we can assert the token from the URL is forwarded.
// ---------------------------------------------------------------------------

const mutateSpy = vi.fn();
let contextState: Partial<UseQueryResult> = {};
let submitState: Partial<UseMutationResult> = {};

vi.mock('@granit/react-identity', () => ({
  IdentityProvider: ({ children }: { children: React.ReactNode }) => children,
  useSessionReviewContext: () => contextState,
  useSubmitSessionReview: () => ({ mutate: mutateSpy, ...submitState }),
}));

const TOKEN = 'valid-review-token';

function renderPage(token: string | null = TOKEN) {
  const path =
    token === null ? '/account/security/review' : `/account/security/review?token=${token}`;
  const user = userEvent.setup();
  const result = render(
    <MemoryRouter initialEntries={[path]}>
      <I18nextProvider i18n={testI18n}>
        <SecurityReviewPage />
      </I18nextProvider>
    </MemoryRouter>
  );
  return { ...result, user };
}

beforeEach(() => {
  vi.clearAllMocks();
  contextState = {};
  submitState = { isPending: false, isSuccess: false, isError: false };
});

describe('SecurityReviewPage', () => {
  it('should show the prompt with location and both choices when not yet reviewed', () => {
    contextState = { data: { country: 'Belgium', decision: null }, isError: false };
    renderPage();

    expect(screen.getByText(/was this you/i)).toBeInTheDocument();
    expect(screen.getByText(/Belgium/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /yes, it was me/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /no, it wasn't me/i })).toBeInTheDocument();
  });

  it('should commit "Confirmed" with the token from the URL when Yes is clicked', async () => {
    contextState = { data: { country: 'Belgium', decision: null }, isError: false };
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: /yes, it was me/i }));

    expect(mutateSpy).toHaveBeenCalledWith({ token: TOKEN, decision: 'Confirmed' });
  });

  it('should commit "Denied" when No is clicked', async () => {
    contextState = { data: { country: null, decision: null }, isError: false };
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: /no, it wasn't me/i }));

    expect(mutateSpy).toHaveBeenCalledWith({ token: TOKEN, decision: 'Denied' });
  });

  it('should show the recognised-device outcome after confirming', () => {
    contextState = { data: { country: 'Belgium', decision: 'Confirmed' }, isError: false };
    submitState = { isPending: false, isSuccess: true, isError: false };
    renderPage();

    expect(screen.getByText(/we've recognised this device/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /yes, it was me/i })).not.toBeInTheDocument();
  });

  it('should show the signed-out outcome after denying', () => {
    contextState = { data: { country: 'France', decision: 'Denied' }, isError: false };
    submitState = { isPending: false, isSuccess: true, isError: false };
    renderPage();

    expect(screen.getByText(/signed you out everywhere/i)).toBeInTheDocument();
  });

  it('should show the already-reviewed state (no buttons) when reviewed on a prior visit', () => {
    contextState = { data: { country: 'France', decision: 'Confirmed' }, isError: false };
    submitState = { isPending: false, isSuccess: false, isError: false };
    renderPage();

    expect(screen.getByText(/already reviewed/i)).toBeInTheDocument();
    expect(screen.getByText(/you confirmed this was you/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /yes, it was me/i })).not.toBeInTheDocument();
  });

  it('should show the invalid/expired message on a 400 from the context call', () => {
    contextState = {
      data: undefined,
      isError: true,
      error: { isAxiosError: true, response: { status: 400 } },
    };
    renderPage();

    expect(screen.getByText(/invalid or has expired/i)).toBeInTheDocument();
  });

  it('should show the invalid/expired message when no token is present', () => {
    contextState = { data: undefined, isError: false };
    renderPage(null);

    expect(screen.getByText(/invalid or has expired/i)).toBeInTheDocument();
  });

  it('should show the verifying state while the context loads', () => {
    contextState = { data: undefined, isError: false };
    renderPage();

    expect(screen.getByText(/checking this link/i)).toBeInTheDocument();
  });
});
