import { renderHook } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it } from 'vitest';

import {
  ImportProvider,
  buildImportQueryKey,
  useImportConfig,
} from '../../import/providers/import-provider';

import type { ImportConfig } from '../../import/providers/import-provider';
import type { ReactNode } from 'react';

function createConfig(overrides?: Partial<ImportConfig>): ImportConfig {
  return {
    client: axios.create(),
    basePath: '/api/v1/data-exchange',
    ...overrides,
  };
}

function wrapper(config: ImportConfig) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <ImportProvider config={config}>{children}</ImportProvider>;
  };
}

describe('ImportProvider', () => {
  it('provides config to children', () => {
    const config = createConfig();
    const { result } = renderHook(() => useImportConfig(), {
      wrapper: wrapper(config),
    });
    expect(result.current.basePath).toBe('/api/v1/data-exchange');
    expect(result.current.client).toBe(config.client);
  });

  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useImportConfig());
    }).toThrow('useImportConfig must be used within an ImportProvider');
  });
});

describe('buildImportQueryKey', () => {
  it('uses queryKeyPrefix when provided', () => {
    const config = createConfig({ queryKeyPrefix: ['admin', 'import'] });
    const key = buildImportQueryKey(config, 'jobs');
    expect(key).toEqual(['admin', 'import', 'jobs']);
  });

  it('defaults to data-import when no prefix', () => {
    const config = createConfig();
    const key = buildImportQueryKey(config, 'jobs', '123');
    expect(key).toEqual(['data-exchange', 'import', 'jobs', '123']);
  });
});
