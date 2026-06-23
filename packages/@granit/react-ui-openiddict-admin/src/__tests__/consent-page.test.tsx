import { screen } from '@testing-library/react';

import { ConsentPage } from '../consent/consent-page';

import { renderWithProviders } from './test-utils';

const grant = vi.fn();
const deny = vi.fn();

let flow: {
  clientId: string | null;
  scopes: readonly string[];
  isPending: boolean;
  grant: typeof grant;
  deny: typeof deny;
} = { clientId: 'demo-app', scopes: ['openid', 'profile'], isPending: false, grant, deny };

let appQuery: { data: { displayName: string } | null; isLoading: boolean; isError: boolean } = {
  data: { displayName: 'Demo App' },
  isLoading: false,
  isError: false,
};

vi.mock('@granit/react-openiddict-admin', () => ({
  useConsentFlow: () => flow,
  useConsentApplication: () => appQuery,
}));

const currentUser = { sub: 'user-1' };

function renderConsent(route = '/consent?returnUrl=%2Fconnect%2Fauthorize') {
  return renderWithProviders(<ConsentPage currentUser={currentUser} />, { route });
}

beforeEach(() => {
  grant.mockReset();
  deny.mockReset();
  flow = { clientId: 'demo-app', scopes: ['openid', 'profile'], isPending: false, grant, deny };
  appQuery = { data: { displayName: 'Demo App' }, isLoading: false, isError: false };
});

describe('ConsentPage', () => {
  it('guards against a missing returnUrl', () => {
    renderConsent('/consent');
    expect(screen.getByText(/missing return url/i)).toBeInTheDocument();
  });

  it('shows application-not-found when the client_id cannot be resolved', () => {
    flow = { ...flow, clientId: null };
    renderConsent();
    expect(screen.getByText(/application.*not found/i)).toBeInTheDocument();
  });

  it('shows application-not-found when the application query errors', () => {
    appQuery = { data: null, isLoading: false, isError: true };
    renderConsent();
    expect(screen.getByText(/application.*not found/i)).toBeInTheDocument();
  });

  it('renders the consent prompt with the application name and requested scopes', () => {
    renderConsent();
    expect(screen.getByRole('heading', { name: 'Authorize Application' })).toBeInTheDocument();
    expect(screen.getByText(/Demo App/)).toBeInTheDocument();
    expect(screen.getByText('openid')).toBeInTheDocument();
    expect(screen.getByText('profile')).toBeInTheDocument();
  });

  it('grants consent when Allow is clicked', async () => {
    const { user } = renderConsent();
    await user.click(screen.getByRole('button', { name: 'Allow' }));
    expect(grant).toHaveBeenCalledTimes(1);
  });

  it('denies consent when Deny is clicked', async () => {
    const { user } = renderConsent();
    await user.click(screen.getByRole('button', { name: 'Deny' }));
    expect(deny).toHaveBeenCalledWith('/');
  });
});
