import { HttpError } from '@granit/api-client';
import { toast } from '@granit/react-ui';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';

import { testI18n } from '../__tests__/test-utils';

import { ExternalLoginButtons } from './external-login-buttons';

import type { ExternalLoginProvider } from '@granit/account';

const mockMutateAsync = vi.fn();
let mockIsPending = false;

// Providers as advertised by `GET /config` — the seam returns this list.
const PROVIDERS: readonly ExternalLoginProvider[] = [
  { name: 'Google', type: 'Google', displayName: 'Google' },
  { name: 'Microsoft', type: 'Microsoft', displayName: 'Microsoft' },
  { name: 'Apple', type: 'Apple', displayName: 'Apple' },
  { name: 'GitHub', type: 'GitHub', displayName: 'GitHub' },
  { name: 'Facebook', type: 'Facebook', displayName: 'Facebook' },
  { name: 'corp-sso', type: 'Oidc', displayName: 'Corporate SSO' },
];

vi.mock('@granit/react-account', async () => {
  // The component narrows errors via HttpError re-exported from the headless
  // package; provide the real class so `instanceof HttpError` matches the
  // instances the test constructs from @granit/api-client.
  const actual = (await vi.importActual('@granit/api-client')) as { HttpError: typeof HttpError };
  return {
    useChallengeExternalLogin: () => ({ mutateAsync: mockMutateAsync, isPending: mockIsPending }),
    HttpError: actual.HttpError,
  };
});

vi.mock('./use-available-external-providers', () => ({
  useAvailableExternalProviders: () => ({ providers: PROVIDERS, isLoading: false }),
}));

vi.mock('sonner', () => ({ toast: { info: vi.fn(), error: vi.fn() } }));

function renderButtons(props: React.ComponentProps<typeof ExternalLoginButtons>) {
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
  mockIsPending = false;
});

describe('ExternalLoginButtons', () => {
  it('offers every available provider in the sign-in variant, labelled by displayName', () => {
    renderButtons({ variant: 'sign-in' });
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with microsoft/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with apple/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with facebook/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /continue with corporate sso/i })
    ).toBeInTheDocument();
  });

  it('hides already-linked providers (by scheme name) in the link variant', () => {
    renderButtons({ variant: 'link', linkedProviders: ['Google', 'Microsoft'] });
    expect(screen.queryByRole('button', { name: /google/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /microsoft/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /link apple/i })).toBeInTheDocument();
  });

  it('renders nothing when every provider is already linked', () => {
    const { container } = renderButtons({
      variant: 'link',
      linkedProviders: PROVIDERS.map((p) => p.name),
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('challenges the chosen provider by its scheme name', async () => {
    mockMutateAsync.mockResolvedValueOnce(undefined);
    const { user } = renderButtons({ variant: 'sign-in' });
    await user.click(screen.getByRole('button', { name: /continue with corporate sso/i }));
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledWith('corp-sso'));
    expect(toast.info).toHaveBeenCalledTimes(1);
  });

  it('shows the unavailable message when the challenge returns 500', async () => {
    mockMutateAsync.mockRejectedValueOnce(new HttpError('handler not registered', 500));
    const { user } = renderButtons({ variant: 'sign-in' });
    await user.click(screen.getByRole('button', { name: /continue with facebook/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/temporarily unavailable/i))
    );
  });

  it('shows the generic failure message for other challenge errors', async () => {
    mockMutateAsync.mockRejectedValueOnce(new HttpError('not configured', 400));
    const { user } = renderButtons({ variant: 'sign-in' });
    await user.click(screen.getByRole('button', { name: /continue with apple/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/could not start sign-in/i))
    );
  });
});
