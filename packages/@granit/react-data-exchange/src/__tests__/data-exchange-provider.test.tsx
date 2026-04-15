import { renderHook } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it } from 'vitest';

import {
  buildExportQueryKey,
  useExportConfig,
} from '../export/providers/export-provider.js';
import {
  buildImportQueryKey,
  useImportConfig,
} from '../import/providers/import-provider.js';
import { DataExchangeProvider } from '../providers/data-exchange-provider.js';

import type { DataExchangeConfig } from '../providers/data-exchange-provider.js';
import type { ReactNode } from 'react';

function createConfig(overrides?: Partial<DataExchangeConfig>): DataExchangeConfig {
  return {
    client: axios.create(),
    ...overrides,
  };
}

function wrapper(config: DataExchangeConfig) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <DataExchangeProvider config={config}>{children}</DataExchangeProvider>
    );
  };
}

describe('DataExchangeProvider', () => {
  it('provides export config to children', () => {
    const config = createConfig();
    const { result } = renderHook(() => useExportConfig(), {
      wrapper: wrapper(config),
    });
    expect(result.current.client).toBe(config.client);
    expect(result.current.basePath).toBe('/api/v1/data-exchange');
  });

  it('provides import config to children', () => {
    const config = createConfig();
    const { result } = renderHook(() => useImportConfig(), {
      wrapper: wrapper(config),
    });
    expect(result.current.client).toBe(config.client);
    expect(result.current.basePath).toBe('/api/v1/data-exchange');
  });

  it('forwards custom basePath to both providers', () => {
    const config = createConfig({ basePath: '/custom/path' });

    const { result: exportResult } = renderHook(() => useExportConfig(), {
      wrapper: wrapper(config),
    });
    const { result: importResult } = renderHook(() => useImportConfig(), {
      wrapper: wrapper(config),
    });

    expect(exportResult.current.basePath).toBe('/custom/path');
    expect(importResult.current.basePath).toBe('/custom/path');
  });

  it('preserves default query key prefixes when queryKeyPrefix is omitted', () => {
    const config = createConfig();

    const { result: exportResult } = renderHook(() => useExportConfig(), {
      wrapper: wrapper(config),
    });
    const { result: importResult } = renderHook(() => useImportConfig(), {
      wrapper: wrapper(config),
    });

    expect(buildExportQueryKey(exportResult.current, 'definitions')).toEqual([
      'data-exchange',
      'metadata',
      'definitions',
    ]);
    expect(buildImportQueryKey(importResult.current, 'jobs')).toEqual([
      'data-exchange',
      'import',
      'jobs',
    ]);
  });

  it('auto-suffixes queryKeyPrefix with export/import when provided', () => {
    const config = createConfig({
      queryKeyPrefix: ['admin', 'countries'],
    });

    const { result: exportResult } = renderHook(() => useExportConfig(), {
      wrapper: wrapper(config),
    });
    const { result: importResult } = renderHook(() => useImportConfig(), {
      wrapper: wrapper(config),
    });

    expect(buildExportQueryKey(exportResult.current, 'definitions')).toEqual([
      'admin',
      'countries',
      'export',
      'definitions',
    ]);
    expect(buildImportQueryKey(importResult.current, 'jobs')).toEqual([
      'admin',
      'countries',
      'import',
      'jobs',
    ]);
  });

  it('shares the same client instance across both providers', () => {
    const config = createConfig();

    const { result: exportResult } = renderHook(() => useExportConfig(), {
      wrapper: wrapper(config),
    });
    const { result: importResult } = renderHook(() => useImportConfig(), {
      wrapper: wrapper(config),
    });

    expect(exportResult.current.client).toBe(importResult.current.client);
  });
});
