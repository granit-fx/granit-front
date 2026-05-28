import { GranitClientProvider } from '@granit/react-api-client';
import { createMockClient } from '@granit/testing';
import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  SettingsProvider,
  buildSettingsQueryKey,
  useSettingsConfig,
} from '../providers/settings-provider.js';

import type { SettingsConfig } from '../providers/settings-provider.js';
import type { AxiosInstance } from 'axios';

const mockConfig: SettingsConfig = {
  client: {} as AxiosInstance,
  basePath: '/api',
};

function createWrapper(config: SettingsConfig) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <SettingsProvider config={config}>{children}</SettingsProvider>;
  };
}

describe('SettingsProvider', () => {
  it('should provide config via useSettingsConfig', () => {
    const { result } = renderHook(() => useSettingsConfig(), {
      wrapper: createWrapper(mockConfig),
    });

    expect(result.current.client).toBe(mockConfig.client);
    expect(result.current.basePath).toBe('/api');
  });

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useSettingsConfig());
    }).toThrow('useSettingsConfig must be used within a SettingsProvider');
  });

  it('falls back to the GranitClientProvider context client when config.client is omitted', () => {
    const contextClient = createMockClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GranitClientProvider client={contextClient as unknown as AxiosInstance}>
        <SettingsProvider config={{}}>{children}</SettingsProvider>
      </GranitClientProvider>
    );

    const { result } = renderHook(() => useSettingsConfig(), { wrapper });

    expect(result.current.client).toBe(contextClient);
  });

  it('throws when no client is available (neither config nor context)', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SettingsProvider config={{}}>{children}</SettingsProvider>
      );
      expect(() => renderHook(() => useSettingsConfig(), { wrapper })).toThrow(
        /SettingsProvider requires an Axios client/
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});

describe('buildSettingsQueryKey', () => {
  it('should build key with default prefix', () => {
    const key = buildSettingsQueryKey(mockConfig, 'user');
    expect(key).toEqual(['settings', 'user']);
  });

  it('should build key with custom prefix', () => {
    const config: SettingsConfig = { ...mockConfig, queryKeyPrefix: ['custom'] };
    const key = buildSettingsQueryKey(config, 'user', 'Granit.Localization.PreferredCulture');
    expect(key).toEqual(['custom', 'user', 'Granit.Localization.PreferredCulture']);
  });
});
