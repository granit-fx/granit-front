import { renderHook } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it } from 'vitest';

import { createConfigProvider } from '../providers/create-config-provider';
import { GranitClientProvider } from '../providers/granit-client-provider';

import type { GranitProviderConfig } from '../providers/create-config-provider';
import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

interface WidgetsConfig extends GranitProviderConfig {
  readonly queryKeyPrefix?: readonly string[];
}

const { Provider: WidgetsProvider, useConfig: useWidgetsConfig } =
  createConfigProvider<WidgetsConfig>({ name: 'Widgets', defaultBasePath: '/api/v1/widgets' });

describe('createConfigProvider', () => {
  it('resolves the client from config and defaults the basePath', () => {
    const client = axios.create();
    const { result } = renderHook(() => useWidgetsConfig(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <WidgetsProvider config={{ client }}>{children}</WidgetsProvider>
      ),
    });
    expect(result.current.client).toBe(client);
    expect(result.current.basePath).toBe('/api/v1/widgets');
  });

  it('keeps an explicit basePath and passes through extra config fields', () => {
    const client = axios.create();
    const { result } = renderHook(() => useWidgetsConfig(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <WidgetsProvider config={{ client, basePath: '/custom', queryKeyPrefix: ['w'] }}>
          {children}
        </WidgetsProvider>
      ),
    });
    expect(result.current.basePath).toBe('/custom');
    expect(result.current.queryKeyPrefix).toEqual(['w']);
  });

  it('falls back to the client from the nearest GranitClientProvider', () => {
    const client = axios.create();
    const { result } = renderHook(() => useWidgetsConfig(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <GranitClientProvider client={client}>
          <WidgetsProvider config={{}}>{children}</WidgetsProvider>
        </GranitClientProvider>
      ),
    });
    expect(result.current.client).toBe(client);
  });

  it('throws when no client is available from config or context', () => {
    expect(() =>
      renderHook(() => useWidgetsConfig(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <WidgetsProvider config={{}}>{children}</WidgetsProvider>
        ),
      })
    ).toThrow('WidgetsProvider requires an Axios client');
  });

  it('throws when the hook is used outside its provider', () => {
    expect(() => renderHook(() => useWidgetsConfig())).toThrow(
      'useWidgetsConfig must be used within a <WidgetsProvider>'
    );
  });
});

interface GadgetsConfig extends GranitProviderConfig {
  readonly queryKeyPrefix?: readonly string[];
}
interface ResolvedGadgetsConfig extends GadgetsConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
}

const {
  Provider: GadgetsProvider,
  useConfig: useGadgetsConfig,
  useOptionalConfig: useOptionalGadgetsConfig,
} = createConfigProvider<GadgetsConfig, ResolvedGadgetsConfig>({
  name: 'Gadgets',
  defaultBasePath: '/api/v1/gadgets',
  resolve: (base) => ({ ...base, queryKeyPrefix: base.queryKeyPrefix ?? ['gadgets'] }),
});

describe('createConfigProvider — resolve hook & useOptionalConfig', () => {
  it('defaults an extra field via the resolve hook', () => {
    const client = axios.create();
    const { result } = renderHook(() => useGadgetsConfig(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <GadgetsProvider config={{ client }}>{children}</GadgetsProvider>
      ),
    });
    expect(result.current.queryKeyPrefix).toEqual(['gadgets']);
  });

  it('keeps a caller-supplied extra field through resolve', () => {
    const client = axios.create();
    const { result } = renderHook(() => useGadgetsConfig(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <GadgetsProvider config={{ client, queryKeyPrefix: ['custom'] }}>
          {children}
        </GadgetsProvider>
      ),
    });
    expect(result.current.queryKeyPrefix).toEqual(['custom']);
  });

  it('useOptionalConfig returns the value inside the provider', () => {
    const client = axios.create();
    const { result } = renderHook(() => useOptionalGadgetsConfig(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <GadgetsProvider config={{ client }}>{children}</GadgetsProvider>
      ),
    });
    expect(result.current?.basePath).toBe('/api/v1/gadgets');
  });

  it('useOptionalConfig returns null outside the provider (no throw)', () => {
    const { result } = renderHook(() => useOptionalGadgetsConfig());
    expect(result.current).toBeNull();
  });
});
