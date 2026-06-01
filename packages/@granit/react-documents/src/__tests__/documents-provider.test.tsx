import { createMockClient } from '@granit/testing';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  buildDocumentsQueryKey,
  DocumentsProvider,
  useDocumentsConfig,
} from '../providers/documents-provider';

import type { DocumentsConfig } from '../providers/documents-provider';
import type { ReactNode } from 'react';

describe('DocumentsProvider', () => {
  it('exposes the resolved config (default basePath + queryKeyPrefix)', () => {
    const client = createMockClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DocumentsProvider config={{ client }}>{children}</DocumentsProvider>
    );

    const { result } = renderHook(() => useDocumentsConfig(), { wrapper });

    expect(result.current.basePath).toBe('/api/v1/documents');
    expect(result.current.queryKeyPrefix).toEqual(['documents']);
    expect(result.current.client).toBe(client);
  });

  it('honors custom basePath and queryKeyPrefix overrides', () => {
    const client = createMockClient();
    const config: DocumentsConfig = {
      client,
      basePath: '/custom/documents',
      queryKeyPrefix: ['tenant-a', 'documents'],
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DocumentsProvider config={config}>{children}</DocumentsProvider>
    );

    const { result } = renderHook(() => useDocumentsConfig(), { wrapper });

    expect(result.current.basePath).toBe('/custom/documents');
    expect(result.current.queryKeyPrefix).toEqual(['tenant-a', 'documents']);
  });

  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useDocumentsConfig())).toThrow(/DocumentsProvider/);
  });

  it('throws when no client is available', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DocumentsProvider config={{}}>{children}</DocumentsProvider>
    );

    expect(() => renderHook(() => useDocumentsConfig(), { wrapper })).toThrow(
      /requires an Axios client/
    );
  });
});

describe('buildDocumentsQueryKey', () => {
  it('prepends the configured prefix to extra segments', () => {
    const client = createMockClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DocumentsProvider config={{ client, queryKeyPrefix: ['p'] }}>{children}</DocumentsProvider>
    );

    const { result } = renderHook(() => useDocumentsConfig(), { wrapper });

    expect(buildDocumentsQueryKey(result.current, 'folders', 'list')).toEqual([
      'p',
      'folders',
      'list',
    ]);
    expect(buildDocumentsQueryKey(result.current, 'quota')).toEqual(['p', 'quota']);
  });
});
