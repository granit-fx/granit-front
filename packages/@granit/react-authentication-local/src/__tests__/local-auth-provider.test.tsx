import { createMockClient } from '@granit/testing';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LocalAuthProvider, useLocalAuthConfig } from '../providers/local-auth-provider';

import type { LocalAuthConfig } from '../providers/local-auth-provider';
import type { ReactNode } from 'react';

describe('LocalAuthProvider', () => {
  it('should provide config with defaults', () => {
    const client = createMockClient();
    const config: LocalAuthConfig = { client };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <LocalAuthProvider config={config}>{children}</LocalAuthProvider>
    );

    const { result } = renderHook(() => useLocalAuthConfig(), { wrapper });

    expect(result.current.client).toBe(client);
    expect(result.current.basePath).toBe('/api/v1/account');
  });

  it('should allow a custom basePath', () => {
    const client = createMockClient();
    const config: LocalAuthConfig = {
      client,
      basePath: '/custom/auth',
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <LocalAuthProvider config={config}>{children}</LocalAuthProvider>
    );

    const { result } = renderHook(() => useLocalAuthConfig(), { wrapper });

    expect(result.current.basePath).toBe('/custom/auth');
  });

  it('should throw when used outside provider', () => {
    expect(() => renderHook(() => useLocalAuthConfig())).toThrowError(
      'useLocalAuthConfig must be used within a <LocalAuthProvider>'
    );
  });
});
