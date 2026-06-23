import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { logger } from '../logger';

const STORAGE_KEY = 'granit-showcase-admin:test-data';

type TestDataSet = {
  id: string;
  name: string;
  data: string;
  createdAt: string;
};

type TestDataStore = Record<string, TestDataSet[]>;

function getStore(): TestDataStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TestDataStore) : {};
  } catch (err) {
    logger.error('[TestDataStore] Failed to parse test data store', err);
    return {};
  }
}

function setStore(store: TestDataStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  globalThis.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
}

function subscribe(callback: () => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  globalThis.addEventListener('storage', handler);
  return () => globalThis.removeEventListener('storage', handler);
}

function getSnapshot(): string {
  return localStorage.getItem(STORAGE_KEY) ?? '{}';
}

export function useTestDataStore(templateName: string) {
  const raw = useSyncExternalStore(subscribe, getSnapshot);
  const store: TestDataStore = useMemo(() => JSON.parse(raw) as TestDataStore, [raw]);
  const datasets = useMemo(() => store[templateName] ?? [], [store, templateName]);

  const save = useCallback(
    (name: string, data: string) => {
      const current = getStore();
      const existing = current[templateName] ?? [];
      const newSet: TestDataSet = {
        id: crypto.randomUUID(),
        name,
        data,
        createdAt: new Date().toISOString(),
      };
      setStore({
        ...current,
        [templateName]: [...existing, newSet],
      });
    },
    [templateName]
  );

  const remove = useCallback(
    (id: string) => {
      const current = getStore();
      const existing = current[templateName] ?? [];
      setStore({
        ...current,
        [templateName]: existing.filter((d) => d.id !== id),
      });
    },
    [templateName]
  );

  const load = useCallback(
    (id: string): string | undefined => {
      return datasets.find((d) => d.id === id)?.data;
    },
    [datasets]
  );

  return { datasets, save, remove, load };
}
