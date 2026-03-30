import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';

import { createAuthContext } from '../providers/use-auth-context.js';

import type { BaseAuthContextType } from '@granit/authentication';

interface TestAuthContextType extends BaseAuthContextType {
  isAdmin: boolean;
}

const mockValue: TestAuthContextType = {
  authenticated: true,
  loading: false,
  user: null,
  login: () => {},
  logout: () => {},
  isAdmin: true,
};

describe('createAuthContext', () => {
  it('should return AuthContext and useAuth', () => {
    const { AuthContext, useAuth } = createAuthContext<TestAuthContextType>();
    expect(AuthContext).toBeDefined();
    expect(typeof useAuth).toBe('function');
  });

  it('should return the context value when useAuth is inside a Provider', () => {
    const { AuthContext, useAuth } = createAuthContext<TestAuthContextType>();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockValue}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.authenticated).toBe(true);
    expect(result.current.isAdmin).toBe(true);
  });

  it('should throw when useAuth is used outside a Provider', () => {
    const { useAuth } = createAuthContext<TestAuthContextType>();
    expect(() => renderHook(() => useAuth())).toThrowError(
      'useAuth must be used within an AuthContext.Provider'
    );
  });
});
