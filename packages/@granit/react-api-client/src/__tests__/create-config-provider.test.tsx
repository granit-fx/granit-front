import { renderHook } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it } from 'vitest';

import { createConfigProvider } from '../providers/create-config-provider';
import { GranitClientProvider } from '../providers/granit-client-provider';

import type { GranitProviderConfig } from '../providers/create-config-provider';
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
