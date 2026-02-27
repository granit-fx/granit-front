import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApiClient, setTokenGetter } from '../index.ts';

import type { AxiosStatic } from 'axios';

// Minimal mock for axios to avoid real HTTP calls
vi.mock('axios', async () => {
  const actual = await vi.importActual<{ default: AxiosStatic }>('axios');
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(() => ({
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      })),
    },
  };
});

describe('createApiClient', () => {
  it('returns an object with interceptors', () => {
    const client = createApiClient({ baseURL: 'https://api.example.com' });
    expect(client).toBeDefined();
    expect(client.interceptors).toBeDefined();
  });
});

describe('setTokenGetter', () => {
  afterEach(() => {
    // Reset global getter between tests
    setTokenGetter(() => Promise.resolve(undefined));
  });

  it('accepts an async getter function without throwing', () => {
    expect(() => {
      setTokenGetter(() => Promise.resolve('mock-token'));
    }).not.toThrow();
  });
});
