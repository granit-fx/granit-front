import { createMockClient } from '@granit/testing';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  EntitiesCustomizationProvider,
  buildCustomizationQueryKey,
  useCustomizationConfig,
} from '../providers/customization-provider';

import type { ReactNode } from 'react';

describe('EntitiesCustomizationProvider', () => {
  it('exposes default apiBase and queryKeyPrefix', () => {
    const client = createMockClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <EntitiesCustomizationProvider config={{ client }}>{children}</EntitiesCustomizationProvider>
    );

    const { result } = renderHook(() => useCustomizationConfig(), { wrapper });

    expect(result.current.apiBase).toBe('/api/v1');
    expect(result.current.queryKeyPrefix).toEqual(['entities-customization']);
    expect(result.current.client).toBe(client);
  });

  it('honors apiBase + queryKeyPrefix overrides', () => {
    const client = createMockClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <EntitiesCustomizationProvider
        config={{ client, apiBase: '/svc', queryKeyPrefix: ['t', 'cust'] }}
      >
        {children}
      </EntitiesCustomizationProvider>
    );

    const { result } = renderHook(() => useCustomizationConfig(), { wrapper });

    expect(result.current.apiBase).toBe('/svc');
    expect(result.current.queryKeyPrefix).toEqual(['t', 'cust']);
  });

  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useCustomizationConfig())).toThrow(
      /EntitiesCustomizationProvider/
    );
  });

  it('throws when no client is available', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <EntitiesCustomizationProvider config={{}}>{children}</EntitiesCustomizationProvider>
    );

    expect(() => renderHook(() => useCustomizationConfig(), { wrapper })).toThrow(
      /requires an Axios client/
    );
  });
});

describe('buildCustomizationQueryKey', () => {
  it('prepends the configured prefix', () => {
    const client = createMockClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <EntitiesCustomizationProvider config={{ client, queryKeyPrefix: ['p'] }}>
        {children}
      </EntitiesCustomizationProvider>
    );

    const { result } = renderHook(() => useCustomizationConfig(), { wrapper });

    expect(buildCustomizationQueryKey(result.current, 'forms', 'Quote', 'Edit')).toEqual([
      'p',
      'forms',
      'Quote',
      'Edit',
    ]);
  });
});
