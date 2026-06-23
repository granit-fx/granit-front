import { act, renderHook } from '@testing-library/react';

import { useTestDataStore } from '../hooks/use-test-data-store';

vi.mock('../logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

const STORAGE_KEY = 'granit-showcase-admin:test-data';

describe('useTestDataStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return empty datasets for unknown template', () => {
    const { result } = renderHook(() => useTestDataStore('Unknown.Template'));
    expect(result.current.datasets).toEqual([]);
  });

  it('should save and retrieve a dataset', () => {
    const { result } = renderHook(() => useTestDataStore('Billing.Invoice'));

    act(() => {
      result.current.save('Test data 1', '{ "amount": 100 }');
    });

    expect(result.current.datasets).toHaveLength(1);
    expect(result.current.datasets[0].name).toBe('Test data 1');
    expect(result.current.datasets[0].data).toBe('{ "amount": 100 }');
  });

  it('should load a dataset by id', () => {
    const { result } = renderHook(() => useTestDataStore('Billing.Invoice'));

    act(() => {
      result.current.save('My set', '{ "key": "value" }');
    });

    const id = result.current.datasets[0].id;
    const loaded = result.current.load(id);
    expect(loaded).toBe('{ "key": "value" }');
  });

  it('should return undefined for unknown dataset id', () => {
    const { result } = renderHook(() => useTestDataStore('Billing.Invoice'));
    expect(result.current.load('nonexistent')).toBeUndefined();
  });

  it('should remove a dataset', () => {
    const { result } = renderHook(() => useTestDataStore('Billing.Invoice'));

    act(() => {
      result.current.save('To remove', '{}');
    });

    const id = result.current.datasets[0].id;

    act(() => {
      result.current.remove(id);
    });

    expect(result.current.datasets).toHaveLength(0);
  });

  it('should isolate datasets per template', () => {
    const { result: hook1 } = renderHook(() => useTestDataStore('Template.One'));
    const { result: hook2 } = renderHook(() => useTestDataStore('Template.Two'));

    act(() => {
      hook1.current.save('Set A', '{ "a": 1 }');
    });

    expect(hook1.current.datasets).toHaveLength(1);
    expect(hook2.current.datasets).toHaveLength(0);
  });

  it('should persist data in localStorage', () => {
    const { result } = renderHook(() => useTestDataStore('Billing.Invoice'));

    act(() => {
      result.current.save('Persistent', '{ "p": true }');
    });

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed['Billing.Invoice']).toHaveLength(1);
  });
});
