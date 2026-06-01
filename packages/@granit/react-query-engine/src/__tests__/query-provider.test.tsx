import { buildQueryKey } from '@granit/query-engine';
import { render, renderHook, screen } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it } from 'vitest';

import { QueryProvider, useQueryConfig } from '../providers/query-provider';

import type { QueryConfig } from '@granit/query-engine';
import type { ReactNode } from 'react';

const mockConfig: QueryConfig = {
  client: axios.create(),
  basePath: '/api/v1/patients',
};

function wrapper({ children }: { children: ReactNode }) {
  return <QueryProvider config={mockConfig}>{children}</QueryProvider>;
}

describe('QueryProvider', () => {
  it('renders children', () => {
    render(
      <QueryProvider config={mockConfig}>
        <div>Test child</div>
      </QueryProvider>
    );
    expect(screen.getByText('Test child')).toBeInTheDocument();
  });
});

describe('useQueryConfig', () => {
  it('returns config from provider', () => {
    const { result } = renderHook(() => useQueryConfig(), { wrapper });
    expect(result.current.basePath).toBe('/api/v1/patients');
    expect(result.current.client).toBeDefined();
  });

  it('throws outside provider', () => {
    expect(() => {
      renderHook(() => useQueryConfig());
    }).toThrow('useQueryConfig must be used within a QueryProvider');
  });
});

describe('buildQueryKey', () => {
  it('builds key from basePath', () => {
    const key = buildQueryKey(mockConfig, 'meta');
    expect(key).toEqual(['api', 'v1', 'patients', 'meta']);
  });

  it('uses custom queryKeyPrefix', () => {
    const config: QueryConfig = {
      ...mockConfig,
      queryKeyPrefix: ['custom', 'prefix'],
    };
    const key = buildQueryKey(config, 'list');
    expect(key).toEqual(['custom', 'prefix', 'list']);
  });

  it('handles multiple segments', () => {
    const key = buildQueryKey(mockConfig, 'saved-views', 'create');
    expect(key).toEqual(['api', 'v1', 'patients', 'saved-views', 'create']);
  });
});
