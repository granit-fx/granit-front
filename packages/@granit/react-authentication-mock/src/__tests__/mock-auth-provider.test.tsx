import { act, render, screen } from '@testing-library/react';
import { createContext, useContext } from 'react';

import { MockAuthProvider } from '../mock-auth-provider';

import type { KeycloakAuthContextType, KeycloakUserInfo } from '@granit/authentication-keycloak';

const TestContext = createContext<KeycloakAuthContextType | undefined>(undefined);

const USER = {
  sub: '1',
  email: 'marie@granit.test',
  email_verified: true,
  name: 'Marie',
  preferred_username: 'marie',
  given_name: 'Marie',
  family_name: 'Dupont',
} as KeycloakUserInfo;

function Probe() {
  const v = useContext(TestContext);
  return <span>{v?.authenticated ? `auth:${v.user?.name}` : 'none'}</span>;
}

describe('MockAuthProvider', () => {
  it('renders children immediately and exposes the fake authenticated user', () => {
    render(
      <MockAuthProvider context={TestContext} user={USER}>
        <Probe />
      </MockAuthProvider>
    );
    expect(screen.getByText('auth:Marie')).toBeInTheDocument();
  });

  it('shows the loadingFallback during the artificial delay, then the children', () => {
    vi.useFakeTimers();
    render(
      <MockAuthProvider
        context={TestContext}
        user={USER}
        loadingMs={500}
        loadingFallback={<span>loading…</span>}
      >
        <Probe />
      </MockAuthProvider>
    );
    expect(screen.getByText('loading…')).toBeInTheDocument();
    expect(screen.queryByText('auth:Marie')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText('auth:Marie')).toBeInTheDocument();
    vi.useRealTimers();
  });
});
