import { renderHook } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it } from 'vitest';

import {
  ExportProvider,
  buildExportQueryKey,
  useExportConfig,
} from '../../export/providers/export-provider';

import type { ExportConfig } from '../../export/providers/export-provider';
import type { ReactNode } from 'react';

function createConfig(overrides?: Partial<ExportConfig>): ExportConfig {
  return {
    client: axios.create(),
    basePath: '/api/v1/data-exchange',
    ...overrides,
  };
}

function wrapper(config: ExportConfig) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <ExportProvider config={config}>{children}</ExportProvider>;
  };
}

describe('ExportProvider', () => {
  it('provides config to children', () => {
    const config = createConfig();
    const { result } = renderHook(() => useExportConfig(), {
      wrapper: wrapper(config),
    });
    expect(result.current.basePath).toBe('/api/v1/data-exchange');
    expect(result.current.client).toBe(config.client);
  });

  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useExportConfig());
    }).toThrow('useExportConfig must be used within an ExportProvider');
  });
});

describe('buildExportQueryKey', () => {
  it('uses queryKeyPrefix when provided', () => {
    const config = createConfig({ queryKeyPrefix: ['admin', 'export'] });
    const key = buildExportQueryKey(config, 'definitions');
    expect(key).toEqual(['admin', 'export', 'definitions']);
  });

  it('defaults to data-export when no prefix', () => {
    const config = createConfig();
    const key = buildExportQueryKey(config, 'jobs', '123');
    expect(key).toEqual(['data-exchange', 'metadata', 'jobs', '123']);
  });
});
