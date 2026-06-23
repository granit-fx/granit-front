import { render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { ConfirmEmailPage } from '../confirm-email-page';

import { testI18n } from './test-utils';

const mockMutate = vi.fn();

vi.mock('@granit/react-account', () => ({
  AccountProvider: ({ children }: { children: React.ReactNode }) => children,
  useConfirmEmail: () => ({ mutate: mockMutate, isPending: false }),
  useResendConfirmation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
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
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={testI18n}>
        <ConfirmEmailPage />
      </I18nextProvider>
    </MemoryRouter>
  );
}

describe('ConfirmEmailPage', () => {
  it('should call confirm email mutation on mount', () => {
    renderPage();
    expect(mockMutate).toHaveBeenCalledWith(
      { userId: 'abc', token: 'xyz' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  it('should show success when mutation succeeds', async () => {
    mockMutate.mockImplementation((_vars: unknown, opts: { onSuccess: () => void }) => {
      opts.onSuccess();
    });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/email confirmed/i)).toBeInTheDocument();
    });
  });

  it('should show error when params are missing', () => {
    renderPage('');
    expect(screen.getByText(/invalid confirmation link/i)).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('should show error when mutation fails', async () => {
    mockMutate.mockImplementation((_vars: unknown, opts: { onError: (err: Error) => void }) => {
      opts.onError(new Error('fail'));
    });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/confirmation failed/i)).toBeInTheDocument();
    });
  });
});
