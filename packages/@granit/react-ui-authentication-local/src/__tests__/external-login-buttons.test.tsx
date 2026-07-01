import { HttpError } from '@granit/api-client';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';

import { ExternalLoginButtons } from '../components/external-login-buttons';

import { testI18n } from './test-utils';

import type { ExternalLoginProvider } from '@granit/account';

// HttpError needs to be a real class so `err instanceof HttpError` resolves in
// the unavailable (500) branch. Defined inside the hoisted factory, then
// imported back as the real export above.
vi.mock('@granit/api-client', () => ({
  HttpError: class HttpError extends Error {
    readonly status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

const mockProviders = vi.fn<[], { providers: readonly ExternalLoginProvider[] }>();
const mockChallengeMutateAsync = vi.fn<[string], Promise<void>>();
const mockChallengeIsPending = { value: false };

vi.mock('@granit/react-account', () => ({
  useAvailableExternalProviders: () => mockProviders(),
  useChallengeExternalLogin: () => ({
    mutateAsync: mockChallengeMutateAsync,
    get isPending() {
      return mockChallengeIsPending.value;
    },
  }),
}));

const toastInfo = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    info: (...args: unknown[]) => toastInfo(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

function provider(name: string, type: string, displayName = name): ExternalLoginProvider {
  return { name, type, displayName } as ExternalLoginProvider;
}

function renderButtons(props: Parameters<typeof ExternalLoginButtons>[0]) {
  const user = userEvent.setup();
  const result = render(
    <I18nextProvider i18n={testI18n}>
      <ExternalLoginButtons {...props} />
    </I18nextProvider>
  );
  return { ...result, user };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockChallengeIsPending.value = false;
  mockProviders.mockReturnValue({ providers: [] });
});

describe('ExternalLoginButtons', () => {
  it('should render nothing when there are no providers', () => {
    const { container } = renderButtons({ variant: 'sign-in' });
    expect(container.firstChild).toBeNull();
  });

  it('should render one button per provider in sign-in variant', () => {
    mockProviders.mockReturnValue({
      providers: [provider('Google', 'google'), provider('GitHub', 'github')],
    });
    renderButtons({ variant: 'sign-in' });
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument();
  });

  it('should use Link wording in link variant', () => {
    mockProviders.mockReturnValue({ providers: [provider('Google', 'google')] });
    renderButtons({ variant: 'link' });
    expect(screen.getByRole('button', { name: /link google/i })).toBeInTheDocument();
  });

  it('should filter out already-linked providers in link variant', () => {
    mockProviders.mockReturnValue({
      providers: [provider('Google', 'google'), provider('GitHub', 'github')],
    });
    renderButtons({ variant: 'link', linkedProviders: ['google'] });
    expect(screen.queryByRole('button', { name: /link google/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /link github/i })).toBeInTheDocument();
  });

  it('should render null when every provider is already linked', () => {
    mockProviders.mockReturnValue({ providers: [provider('Google', 'google')] });
    const { container } = renderButtons({ variant: 'link', linkedProviders: ['GOOGLE'] });
    expect(container.firstChild).toBeNull();
  });

  it('should challenge the provider and toast on success', async () => {
    mockChallengeMutateAsync.mockResolvedValueOnce();
    mockProviders.mockReturnValue({ providers: [provider('Google', 'google')] });
    const { user } = renderButtons({ variant: 'sign-in' });

    await user.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => {
      expect(mockChallengeMutateAsync).toHaveBeenCalledWith('Google');
      expect(toastInfo).toHaveBeenCalled();
    });
  });

  it('should show the unavailable toast on a 500 HttpError', async () => {
    mockChallengeMutateAsync.mockRejectedValueOnce(new HttpError('nope', 500));
    mockProviders.mockReturnValue({ providers: [provider('Google', 'google')] });
    const { user } = renderButtons({ variant: 'sign-in' });

    await user.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(expect.stringMatching(/temporarily unavailable/i));
    });
  });

  it('should show the generic failure toast on a non-500 error', async () => {
    mockChallengeMutateAsync.mockRejectedValueOnce(new HttpError('bad', 400));
    mockProviders.mockReturnValue({ providers: [provider('Google', 'google')] });
    const { user } = renderButtons({ variant: 'sign-in' });

    await user.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(expect.stringMatching(/could not start/i));
    });
  });

  it('should disable buttons while a challenge is pending', () => {
    mockChallengeIsPending.value = true;
    mockProviders.mockReturnValue({ providers: [provider('Google', 'google')] });
    renderButtons({ variant: 'sign-in' });
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeDisabled();
  });
});
