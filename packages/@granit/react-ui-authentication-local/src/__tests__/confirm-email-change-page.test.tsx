import { render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { ConfirmEmailChangePage } from '../confirm-email-change-page';

import { testI18n } from './test-utils';

const mockMutate = vi.fn();

vi.mock('@granit/react-account', () => ({
  AccountProvider: ({ children }: { children: React.ReactNode }) => children,
  useConfirmEmailChange: () => ({ mutate: mockMutate, isPending: false }),
}));

const VALID_SEARCH = '?userId=abc&newEmail=new%40example.com&token=xyz';

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'location', {
    value: { search: VALID_SEARCH, href: '' },
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
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={testI18n}>
        <ConfirmEmailChangePage />
      </I18nextProvider>
    </MemoryRouter>
  );
}

describe('ConfirmEmailChangePage', () => {
  it('should call the confirm mutation with the URL params on mount', () => {
    renderPage();
    expect(mockMutate).toHaveBeenCalledWith(
      { userId: 'abc', newEmail: 'new@example.com', token: 'xyz' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  it('should show the loading/verifying state initially', () => {
    renderPage();
    expect(screen.getByText('Confirming your new email address…')).toBeInTheDocument();
  });

  it('should show the success state when the mutation succeeds', async () => {
    mockMutate.mockImplementation((_vars: unknown, opts: { onSuccess: () => void }) => {
      opts.onSuccess();
    });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Email address changed')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Your email address has been updated successfully.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in with your new email' })).toBeInTheDocument();
  });

  it('should show the invalid-link error when params are missing', () => {
    renderPage('');
    expect(screen.getByText('Invalid or expired email change link.')).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('should show the expired-token error when the mutation fails', async () => {
    mockMutate.mockImplementation((_vars: unknown, opts: { onError: (err: Error) => void }) => {
      opts.onError(new Error('expired'));
    });
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(
          'Email change confirmation failed. The link may have expired or already been used.'
        )
      ).toBeInTheDocument();
    });
  });
});
