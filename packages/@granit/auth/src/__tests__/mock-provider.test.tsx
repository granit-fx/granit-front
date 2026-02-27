import { render, renderHook, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';

import { createMockProvider } from '../mock-provider.tsx';
import { createAuthContext } from '../use-auth-context.ts';

import type { BaseAuthContextType } from '../types.ts';

const mockValue: BaseAuthContextType = {
  keycloak: null,
  authenticated: true,
  loading: false,
  user: null,
  login: () => {},
  logout: () => {},
};

describe('createMockProvider', () => {
  it('returns a component with displayName MockAuthProvider', () => {
    const { AuthContext } = createAuthContext<BaseAuthContextType>();
    const Provider = createMockProvider(AuthContext, mockValue);
    expect(Provider.displayName).toBe('MockAuthProvider');
  });

  it('renders children', () => {
    const { AuthContext } = createAuthContext<BaseAuthContextType>();
    const Provider = createMockProvider(AuthContext, mockValue);
    render(
      <Provider>
        <span data-testid="child">hello</span>
      </Provider>
    );
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('provides the mock auth value to context consumers', () => {
    const { AuthContext, useAuth } = createAuthContext<BaseAuthContextType>();
    const Provider = createMockProvider(AuthContext, mockValue);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider>{children}</Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.authenticated).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('provides a custom value with extended fields', () => {
    interface ExtendedAuth extends BaseAuthContextType {
      role: string;
    }

    const extValue: ExtendedAuth = { ...mockValue, role: 'admin' };
    const { AuthContext, useAuth } = createAuthContext<ExtendedAuth>();
    const Provider = createMockProvider(AuthContext, extValue);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider>{children}</Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.role).toBe('admin');
  });
});
