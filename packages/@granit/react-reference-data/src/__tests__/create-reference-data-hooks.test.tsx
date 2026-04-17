import { createQueryWrapper } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { toEntityId } from '@granit/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createReferenceDataHooks } from '../hooks/create-reference-data-hooks.js';

import type { ReferenceDataEntry } from '@granit/reference-data';

interface TestEntity extends ReferenceDataEntry {
  readonly extra: string;
}

const mockEntry: TestEntity = {
  id: toEntityId<'ReferenceDataEntry'>('a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  code: 'BE',
  labelEn: 'Belgium',
  labelFr: 'Belgique',
  labelNl: 'België',
  labelDe: 'Belgien',
  labelEs: 'Bélgica',
  labelIt: 'Belgio',
  labelPt: 'Bélgica',
  labelZh: '比利时',
  labelJa: 'ベルギー',
  labelPl: 'Belgia',
  labelTr: 'Belçika',
  labelKo: '벨기에',
  labelSv: 'Belgien',
  labelCs: 'Belgie',
  label: 'Belgium',
  activated: true,
  sortOrder: 1,
  validFrom: null,
  validTo: null,
  parentCode: null,
  extraProperties: null,
  extra: 'test-value',
};

const { keys, useList, useEntry, useChildren, useCreate, useUpdate, useDeactivate } =
  createReferenceDataHooks<TestEntity>('test-entities');

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

describe('keys', () => {
  it('namespaces keys by entity name', () => {
    expect(keys.all).toEqual(['reference-data', 'test-entities']);
  });

  it('builds list keys with params', () => {
    expect(keys.list({ search: 'foo' })).toEqual([
      'reference-data',
      'test-entities',
      'list',
      { search: 'foo' },
    ]);
  });

  it('builds detail keys with code', () => {
    expect(keys.detail('BE')).toEqual(['reference-data', 'test-entities', 'detail', 'BE']);
  });

  it('builds children keys with parent code', () => {
    expect(keys.children('ELECTRONICS')).toEqual([
      'reference-data',
      'test-entities',
      'children',
      'ELECTRONICS',
    ]);
  });

  it('isolates keys between entity types', () => {
    const other = createReferenceDataHooks<ReferenceDataEntry>('other-entity');
    expect(keys.all).not.toEqual(other.keys.all);
  });
});

// ---------------------------------------------------------------------------
// useList
// ---------------------------------------------------------------------------

describe('useList', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches the list with default base path', async () => {
    const client = createMockClient();
    const pagedResult = { items: [mockEntry], totalCount: 1 };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(pagedResult));

    const { result } = renderHook(() => useList({ client }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/reference-data/test-entities', {
      params: undefined,
    });
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0]!.code).toBe('BE');
  });

  it('passes query params', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ items: [], totalCount: 0 }));

    const { result } = renderHook(
      () => useList({ client, params: { activeOnly: true, search: 'bel' } }),
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/reference-data/test-entities', {
      params: { activeOnly: true, search: 'bel' },
    });
  });

  it('uses custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ items: [], totalCount: 0 }));

    const { result } = renderHook(() => useList({ client, basePath: '/custom/path' }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/custom/path', {
      params: undefined,
    });
  });

  it('does not fetch when enabled is false', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useList({ client, enabled: false }), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(client.get).not.toHaveBeenCalled();
  });

  it('exposes error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useList({ client }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Network error');
  });
});

// ---------------------------------------------------------------------------
// useEntry
// ---------------------------------------------------------------------------

describe('useEntry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches a single entry by code', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(mockEntry));

    const { result } = renderHook(() => useEntry('BE', { client }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/reference-data/test-entities/BE');
    expect(result.current.data?.code).toBe('BE');
    expect(result.current.data?.extra).toBe('test-value');
  });

  it('uses custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(mockEntry));

    const { result } = renderHook(() => useEntry('BE', { client, basePath: '/custom' }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/custom/BE');
  });

  it('does not fetch when enabled is false', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useEntry('BE', { client, enabled: false }), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(client.get).not.toHaveBeenCalled();
  });

  it('does not fetch when code is empty', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useEntry('', { client }), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(client.get).not.toHaveBeenCalled();
  });

  it('exposes error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useEntry('XX', { client }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Not found');
  });
});

// ---------------------------------------------------------------------------
// useChildren
// ---------------------------------------------------------------------------

describe('useChildren', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches children of a parent code', async () => {
    const client = createMockClient();
    const children = [{ ...mockEntry, code: 'CHILD-1', parentCode: 'BE' }];
    vi.mocked(client.get).mockResolvedValue(axiosResponse(children));

    const { result } = renderHook(() => useChildren('BE', { client }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/reference-data/test-entities/BE/children');
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]!.parentCode).toBe('BE');
  });

  it('uses custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

    const { result } = renderHook(() => useChildren('BE', { client, basePath: '/custom' }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/custom/BE/children');
  });

  it('does not fetch when enabled is false', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useChildren('BE', { client, enabled: false }), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(client.get).not.toHaveBeenCalled();
  });

  it('does not fetch when parent code is empty', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useChildren('', { client }), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(client.get).not.toHaveBeenCalled();
  });

  it('exposes error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useChildren('XX', { client }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Not found');
  });
});

// ---------------------------------------------------------------------------
// useCreate
// ---------------------------------------------------------------------------

describe('useCreate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends POST to the base path', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useCreate({ client }), {
      wrapper: createQueryWrapper(),
    });

    act(() => {
      result.current.mutate({ code: 'BE', labelEn: 'Belgium' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/reference-data/test-entities', {
      code: 'BE',
      labelEn: 'Belgium',
    });
  });

  it('uses custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useCreate({ client, basePath: '/custom' }), {
      wrapper: createQueryWrapper(),
    });

    act(() => {
      result.current.mutate({ code: 'BE', labelEn: 'Belgium' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/custom', expect.anything());
  });

  it('exposes error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Forbidden'));

    const { result } = renderHook(() => useCreate({ client }), {
      wrapper: createQueryWrapper(),
    });

    act(() => {
      result.current.mutate({ code: 'BE', labelEn: 'Belgium' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Forbidden');
  });
});

// ---------------------------------------------------------------------------
// useUpdate
// ---------------------------------------------------------------------------

describe('useUpdate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends PUT with code and data', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useUpdate({ client }), {
      wrapper: createQueryWrapper(),
    });

    act(() => {
      result.current.mutate({
        code: 'BE',
        data: { labelEn: 'Belgium (updated)' },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.put).toHaveBeenCalledWith('/api/v1/reference-data/test-entities/BE', {
      labelEn: 'Belgium (updated)',
    });
  });

  it('exposes error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockRejectedValue(new Error('Conflict'));

    const { result } = renderHook(() => useUpdate({ client }), {
      wrapper: createQueryWrapper(),
    });

    act(() => {
      result.current.mutate({ code: 'BE', data: { labelEn: 'Test' } });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Conflict');
  });
});

// ---------------------------------------------------------------------------
// useDeactivate
// ---------------------------------------------------------------------------

describe('useDeactivate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends DELETE for the given code', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useDeactivate({ client }), {
      wrapper: createQueryWrapper(),
    });

    act(() => {
      result.current.mutate('BE');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.delete).toHaveBeenCalledWith('/api/v1/reference-data/test-entities/BE');
  });

  it('exposes error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useDeactivate({ client }), {
      wrapper: createQueryWrapper(),
    });

    act(() => {
      result.current.mutate('XX');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Not found');
  });
});

// ---------------------------------------------------------------------------
// Factory with custom defaultBasePath
// ---------------------------------------------------------------------------

describe('createReferenceDataHooks with custom defaultBasePath', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the factory-level default base path', async () => {
    const { useList: useCustomList } = createReferenceDataHooks<TestEntity>('custom', {
      defaultBasePath: '/api/v2/ref/custom',
    });

    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ items: [], totalCount: 0 }));

    const { result } = renderHook(() => useCustomList({ client }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v2/ref/custom', {
      params: undefined,
    });
  });
});
