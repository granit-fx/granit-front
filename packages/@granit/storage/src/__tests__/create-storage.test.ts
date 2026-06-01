import { afterEach, describe, expect, it } from 'vitest';

import { createStorage } from '../create-storage';

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('createStorage', () => {
  it('should prefix key with dd:', () => {
    const storage = createStorage<string>('locale');
    expect(storage.key).toBe('dd:locale');
  });

  it('should return null when key does not exist', () => {
    const storage = createStorage<string>('missing');
    expect(storage.get()).toBeNull();
  });

  it('should write and read a string value', () => {
    const storage = createStorage<string>('theme');
    storage.set('dark');
    expect(storage.get()).toBe('dark');
  });

  it('should write and read an object value', () => {
    const storage = createStorage<{ open: boolean }>('sidebar');
    storage.set({ open: true });
    expect(storage.get()).toEqual({ open: true });
  });

  it('should write and read a number value', () => {
    const storage = createStorage<number>('count');
    storage.set(42);
    expect(storage.get()).toBe(42);
  });

  it('should write and read a boolean value', () => {
    const storage = createStorage<boolean>('flag');
    storage.set(false);
    expect(storage.get()).toBe(false);
  });

  it('should remove the key', () => {
    const storage = createStorage<string>('temp');
    storage.set('value');
    storage.remove();
    expect(storage.get()).toBeNull();
  });

  it('should return null for corrupted JSON', () => {
    localStorage.setItem('dd:broken', '{invalid-json');
    const storage = createStorage<Record<string, unknown>>('broken');
    expect(storage.get()).toBeNull();
  });

  it('should use sessionStorage when storage option is session', () => {
    const storage = createStorage<string>('session-key', { storage: 'session' });
    storage.set('hello');
    expect(sessionStorage.getItem('dd:session-key')).toBe('"hello"');
    expect(localStorage.getItem('dd:session-key')).toBeNull();
  });

  it('should use custom serializer and deserializer', () => {
    const storage = createStorage<Date>('date', {
      serialize: (d) => d.toISOString(),
      deserialize: (raw) => new Date(raw),
    });
    const date = new Date('2026-01-15T12:00:00Z');
    storage.set(date);
    const result = storage.get();
    expect(result).toBeInstanceOf(Date);
    expect(result?.toISOString()).toBe('2026-01-15T12:00:00.000Z');
  });

  it('should write to the correct prefixed key in localStorage', () => {
    const storage = createStorage<string>('my-key');
    storage.set('value');
    expect(localStorage.getItem('dd:my-key')).toBe('"value"');
    expect(localStorage.getItem('my-key')).toBeNull();
  });
});
