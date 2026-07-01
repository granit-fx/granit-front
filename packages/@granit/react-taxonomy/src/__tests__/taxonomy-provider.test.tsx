import { createMockClient } from '@granit/testing';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildTaxonomyQueryKey } from '../hooks/query-keys';
import { TaxonomyProvider, useTaxonomyConfig } from '../providers/taxonomy-provider';

import type { TaxonomyConfig } from '../providers/taxonomy-provider';
import type { ReactNode } from 'react';

describe('TaxonomyProvider', () => {
  it('exposes the resolved config (default basePath + queryKeyPrefix)', () => {
    const client = createMockClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <TaxonomyProvider config={{ client }}>{children}</TaxonomyProvider>
    );

    const { result } = renderHook(() => useTaxonomyConfig(), { wrapper });

    expect(result.current.basePath).toBe('/api/v1/taxonomy');
    expect(result.current.queryKeyPrefix).toEqual(['taxonomy']);
    expect(result.current.client).toBe(client);
  });

  it('honors custom basePath and queryKeyPrefix overrides', () => {
    const client = createMockClient();
    const config: TaxonomyConfig = {
      client,
      basePath: '/custom/taxonomy',
      queryKeyPrefix: ['tenant-a', 'taxonomy'],
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <TaxonomyProvider config={config}>{children}</TaxonomyProvider>
    );

    const { result } = renderHook(() => useTaxonomyConfig(), { wrapper });

    expect(result.current.basePath).toBe('/custom/taxonomy');
    expect(result.current.queryKeyPrefix).toEqual(['tenant-a', 'taxonomy']);
  });

  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useTaxonomyConfig())).toThrow(/TaxonomyProvider/);
  });

  it('throws when no client is available (no config.client and no GranitClientProvider)', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <TaxonomyProvider config={{}}>{children}</TaxonomyProvider>
    );

    expect(() => renderHook(() => useTaxonomyConfig(), { wrapper })).toThrow(
      /requires an Axios client/
    );
  });
});

describe('buildTaxonomyQueryKey', () => {
  it('prepends the configured prefix to extra segments', () => {
    const client = createMockClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <TaxonomyProvider config={{ client, queryKeyPrefix: ['p'] }}>{children}</TaxonomyProvider>
    );

    const { result } = renderHook(() => useTaxonomyConfig(), { wrapper });

    expect(buildTaxonomyQueryKey(result.current, 'tags', { scope: 'documents' })).toEqual([
      'p',
      'tags',
      { scope: 'documents' },
    ]);
    expect(buildTaxonomyQueryKey(result.current, 'category', 'cat-1')).toEqual([
      'p',
      'category',
      'cat-1',
    ]);
  });
});
