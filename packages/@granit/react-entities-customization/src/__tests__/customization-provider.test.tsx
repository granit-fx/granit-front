import { createMockClient } from '@granit/testing';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  CustomizationProvider,
  buildCustomizationQueryKey,
  useCustomizationConfig,
} from '../providers/customization-provider.js';

import type { ReactNode } from 'react';

describe('CustomizationProvider', () => {
  it('exposes default apiBase and queryKeyPrefix', () => {
    const client = createMockClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <CustomizationProvider config={{ client }}>{children}</CustomizationProvider>
    );

    const { result } = renderHook(() => useCustomizationConfig(), { wrapper });

    expect(result.current.apiBase).toBe('/api/v1');
    expect(result.current.queryKeyPrefix).toEqual(['entities-customization']);
    expect(result.current.client).toBe(client);
  });

  it('honors apiBase + queryKeyPrefix overrides', () => {
    const client = createMockClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <CustomizationProvider config={{ client, apiBase: '/svc', queryKeyPrefix: ['t', 'cust'] }}>
        {children}
      </CustomizationProvider>
    );

    const { result } = renderHook(() => useCustomizationConfig(), { wrapper });

    expect(result.current.apiBase).toBe('/svc');
    expect(result.current.queryKeyPrefix).toEqual(['t', 'cust']);
  });

  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useCustomizationConfig())).toThrow(/CustomizationProvider/);
  });

  it('throws when no client is available', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <CustomizationProvider config={{}}>{children}</CustomizationProvider>
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
      <CustomizationProvider config={{ client, queryKeyPrefix: ['p'] }}>
        {children}
      </CustomizationProvider>
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
