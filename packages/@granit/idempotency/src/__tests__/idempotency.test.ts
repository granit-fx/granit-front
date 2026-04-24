import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Dynamic import for fresh module state per test suite
interface ApiClientModule {
  createApiClient: (config: { baseURL: string }) => AxiosInstance;
  setIdempotencyKeyGenerator: (
    generator: (config: InternalAxiosRequestConfig) => string | undefined
  ) => void;
}

interface IdempotencyModule {
  enableIdempotency: (options?: {
    methods?: string[];
    headerName?: string;
    keyGenerator?: (config: InternalAxiosRequestConfig) => string | undefined;
  }) => void;
  disableIdempotency: () => void;
}

function captureAdapter(config: InternalAxiosRequestConfig) {
  return Promise.resolve({
    data: { __captured: true },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  });
}

describe('enableIdempotency', () => {
  let apiMod: ApiClientModule;
  let idempotencyMod: IdempotencyModule;

  beforeEach(async () => {
    vi.resetModules();
    apiMod = await import('@granit/api-client');
    idempotencyMod = await import('../index.ts');
  });

  it('should inject Idempotency-Key header on POST requests', async () => {
    idempotencyMod.enableIdempotency();
    const client = apiMod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    const response = await client.post('/test', { data: 'value' });
    const key = response.config.headers['Idempotency-Key'] as string;
    expect(key).toBeDefined();
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should inject Idempotency-Key header on PUT requests', async () => {
    idempotencyMod.enableIdempotency();
    const client = apiMod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    const response = await client.put('/test/1', { data: 'value' });
    expect(response.config.headers['Idempotency-Key']).toBeDefined();
  });

  it('should inject Idempotency-Key header on PATCH requests', async () => {
    idempotencyMod.enableIdempotency();
    const client = apiMod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    const response = await client.patch('/test/1', { data: 'value' });
    expect(response.config.headers['Idempotency-Key']).toBeDefined();
  });

  it('should inject Idempotency-Key header on DELETE requests', async () => {
    idempotencyMod.enableIdempotency();
    const client = apiMod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    const response = await client.delete('/test/1');
    expect(response.config.headers['Idempotency-Key']).toBeDefined();
  });

  it('should NOT inject Idempotency-Key header on GET requests', async () => {
    idempotencyMod.enableIdempotency();
    const client = apiMod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    const response = await client.get('/test');
    expect(response.config.headers['Idempotency-Key']).toBeUndefined();
  });

  it('should generate unique keys for each request', async () => {
    idempotencyMod.enableIdempotency();
    const client = apiMod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    const r1 = await client.post('/test', {});
    const r2 = await client.post('/test', {});
    const key1 = r1.config.headers['Idempotency-Key'] as string;
    const key2 = r2.config.headers['Idempotency-Key'] as string;

    expect(key1).toBeDefined();
    expect(key2).toBeDefined();
    expect(key1).not.toBe(key2);
  });
});

describe('enableIdempotency with custom options', () => {
  let apiMod: ApiClientModule;
  let idempotencyMod: IdempotencyModule;

  beforeEach(async () => {
    vi.resetModules();
    apiMod = await import('@granit/api-client');
    idempotencyMod = await import('../index.ts');
  });

  it('should restrict to specified methods only', async () => {
    idempotencyMod.enableIdempotency({ methods: ['post'] });
    const client = apiMod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    const postRes = await client.post('/test', {});
    expect(postRes.config.headers['Idempotency-Key']).toBeDefined();

    const putRes = await client.put('/test/1', {});
    expect(putRes.config.headers['Idempotency-Key']).toBeUndefined();

    const deleteRes = await client.delete('/test/1');
    expect(deleteRes.config.headers['Idempotency-Key']).toBeUndefined();
  });

  it('should use custom key generator', async () => {
    idempotencyMod.enableIdempotency({
      keyGenerator: () => 'custom-fixed-key',
    });
    const client = apiMod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    const response = await client.post('/test', {});
    expect(response.config.headers['Idempotency-Key']).toBe('custom-fixed-key');
  });

  it('should skip header when custom generator returns undefined', async () => {
    idempotencyMod.enableIdempotency({
      keyGenerator: () => undefined,
    });
    const client = apiMod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    const response = await client.post('/test', {});
    expect(response.config.headers['Idempotency-Key']).toBeUndefined();
  });
});

describe('disableIdempotency', () => {
  let apiMod: ApiClientModule;
  let idempotencyMod: IdempotencyModule;

  beforeEach(async () => {
    vi.resetModules();
    apiMod = await import('@granit/api-client');
    idempotencyMod = await import('../index.ts');
  });

  it('should stop injecting Idempotency-Key header after disable', async () => {
    idempotencyMod.enableIdempotency();
    const client = apiMod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    const r1 = await client.post('/test', {});
    expect(r1.config.headers['Idempotency-Key']).toBeDefined();

    idempotencyMod.disableIdempotency();
    const client2 = apiMod.createApiClient({ baseURL: 'https://api.example.com' });
    client2.defaults.adapter = captureAdapter;

    const r2 = await client2.post('/test', {});
    expect(r2.config.headers['Idempotency-Key']).toBeUndefined();
  });
});

describe('shouldRetryIgnoringTombstone', () => {
  interface RetryModule {
    shouldRetryIgnoringTombstone: (
      failureCount: number,
      error: unknown,
      maxAttempts?: number
    ) => boolean;
  }

  let idempotencyMod: RetryModule;

  beforeEach(async () => {
    vi.resetModules();
    idempotencyMod = (await import('../index.ts')) as unknown as RetryModule;
  });

  function tombstoneError(reason = 'ResponseTooLarge'): unknown {
    return {
      response: {
        status: 413,
        headers: { 'x-idempotency-tombstone': reason },
      },
      message: 'Payload Too Large',
    };
  }

  it('returns false for tombstoned errors regardless of failure count', () => {
    expect(idempotencyMod.shouldRetryIgnoringTombstone(0, tombstoneError())).toBe(false);
    expect(idempotencyMod.shouldRetryIgnoringTombstone(1, tombstoneError())).toBe(false);
  });

  it('returns true below the default max-attempts bound for non-tombstoned errors', () => {
    const transientError = new Error('network failure');

    expect(idempotencyMod.shouldRetryIgnoringTombstone(0, transientError)).toBe(true);
    expect(idempotencyMod.shouldRetryIgnoringTombstone(2, transientError)).toBe(true);
  });

  it('returns false at or above the max-attempts bound', () => {
    const transientError = new Error('network failure');

    expect(idempotencyMod.shouldRetryIgnoringTombstone(3, transientError)).toBe(false);
    expect(idempotencyMod.shouldRetryIgnoringTombstone(99, transientError)).toBe(false);
  });

  it('respects a custom max-attempts value', () => {
    const transientError = new Error('network failure');

    expect(idempotencyMod.shouldRetryIgnoringTombstone(1, transientError, 1)).toBe(false);
    expect(idempotencyMod.shouldRetryIgnoringTombstone(0, transientError, 1)).toBe(true);
  });

  it('returns true for a non-tombstoned 413 (different cause)', () => {
    // A 413 from Kestrel's max-request-body limit has no tombstone header —
    // retrying a smaller payload could succeed, so we do not block retries
    // just because the status was 413.
    const plain413: unknown = {
      response: { status: 413, headers: { 'content-length': '0' } },
      message: 'Payload Too Large',
    };

    expect(idempotencyMod.shouldRetryIgnoringTombstone(0, plain413)).toBe(true);
  });
});
