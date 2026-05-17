import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ApiClientConfig } from '../index.ts';
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

// Dynamic import type to get fresh module state per test
interface ApiClientModule {
  createApiClient: (
    config: ApiClientConfig & {
      mode?: 'bearer' | 'bff';
      csrfTokenGetter?: () => string | null;
    }
  ) => AxiosInstance;
  setTokenGetter: (getter: () => Promise<string | undefined>) => void;
  setTenantGetter: (getter: () => string | undefined) => void;
  setOnUnauthorized: (callback: () => void) => void;
  setIdempotencyKeyGenerator: (
    generator: (config: InternalAxiosRequestConfig) => string | undefined
  ) => void;
  createMutator: (
    instance: AxiosInstance
  ) => <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig) => Promise<T>;
}

/**
 * Adapter that resolves immediately, allowing interceptors to run
 * without making actual HTTP calls. Returns the final request config
 * (post-interceptor) inside response.data for inspection.
 */
function captureAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  return Promise.resolve({
    data: { __captured: true },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  });
}

function rejectAdapter(status: number) {
  return (config: InternalAxiosRequestConfig) => {
    const error = new Error(`Request failed with status ${status}`) as Error & {
      response: {
        status: number;
        data: object;
        headers: object;
        config: InternalAxiosRequestConfig;
        statusText: string;
      };
      config: InternalAxiosRequestConfig;
      isAxiosError: boolean;
    };
    error.response = { status, data: {}, headers: {}, config, statusText: 'Error' };
    error.config = config;
    error.isAxiosError = true;
    return Promise.reject(error);
  };
}

describe('createApiClient', () => {
  let mod: ApiClientModule;

  beforeEach(async () => {
    vi.resetModules();
    mod = await import('../index.ts');
  });

  it('should create an instance with correct baseURL and default timeout', () => {
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    expect(client.defaults.baseURL).toBe('https://api.example.com');
    expect(client.defaults.timeout).toBe(10_000);
  });

  it('should accept a custom timeout', () => {
    const client = mod.createApiClient({ baseURL: 'https://api.example.com', timeout: 30_000 });
    expect(client.defaults.timeout).toBe(30_000);
  });

  it('should set Content-Type to application/json', () => {
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    expect(client.defaults.headers['Content-Type']).toBe('application/json');
  });
});

describe('token interceptor', () => {
  let mod: ApiClientModule;

  beforeEach(async () => {
    vi.resetModules();
    mod = await import('../index.ts');
  });

  it('should inject Authorization header when token getter returns a token', async () => {
    mod.setTokenGetter(() => Promise.resolve('my-jwt-token'));
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    const response = await client.get('/test');
    expect(response.config.headers.Authorization).toBe('Bearer my-jwt-token');
  });

  it('should not inject Authorization header when token getter returns undefined', async () => {
    mod.setTokenGetter(() => Promise.resolve(undefined));
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    const response = await client.get('/test');
    expect(response.config.headers.Authorization).toBeUndefined();
  });

  it('should not inject Authorization header when no token getter is configured', async () => {
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    const response = await client.get('/test');
    expect(response.config.headers.Authorization).toBeUndefined();
  });
});

describe('tenant interceptor', () => {
  let mod: ApiClientModule;

  beforeEach(async () => {
    vi.resetModules();
    mod = await import('../index.ts');
  });

  it('should inject X-Tenant-Id header when tenant getter returns a value', async () => {
    mod.setTenantGetter(() => 'tenant-42');
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    const response = await client.get('/test');
    expect(response.config.headers['X-Tenant-Id']).toBe('tenant-42');
  });

  it('should not inject X-Tenant-Id when tenant getter returns undefined', async () => {
    mod.setTenantGetter(() => undefined);
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    const response = await client.get('/test');
    expect(response.config.headers['X-Tenant-Id']).toBeUndefined();
  });

  it('should not inject X-Tenant-Id when no tenant getter is configured', async () => {
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    const response = await client.get('/test');
    expect(response.config.headers['X-Tenant-Id']).toBeUndefined();
  });
});

describe('combined interceptors', () => {
  let mod: ApiClientModule;

  beforeEach(async () => {
    vi.resetModules();
    mod = await import('../index.ts');
  });

  it('should inject both Authorization and X-Tenant-Id when both getters are configured', async () => {
    mod.setTokenGetter(() => Promise.resolve('jwt-123'));
    mod.setTenantGetter(() => 'tenant-abc');
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    const response = await client.get('/test');
    expect(response.config.headers.Authorization).toBe('Bearer jwt-123');
    expect(response.config.headers['X-Tenant-Id']).toBe('tenant-abc');
  });
});

describe('setTokenGetter', () => {
  let mod: ApiClientModule;

  beforeEach(async () => {
    vi.resetModules();
    mod = await import('../index.ts');
  });

  it('should accept an async getter function without throwing', () => {
    expect(() => {
      mod.setTokenGetter(() => Promise.resolve('mock-token'));
    }).not.toThrow();
  });
});

describe('setTenantGetter', () => {
  let mod: ApiClientModule;

  beforeEach(async () => {
    vi.resetModules();
    mod = await import('../index.ts');
  });

  it('should accept a synchronous getter function without throwing', () => {
    expect(() => {
      mod.setTenantGetter(() => 'tenant-1');
    }).not.toThrow();
  });
});

describe('idempotency interceptor', () => {
  let mod: ApiClientModule;

  beforeEach(async () => {
    vi.resetModules();
    mod = await import('../index.ts');
  });

  it('should inject Idempotency-Key when generator returns a value', async () => {
    mod.setIdempotencyKeyGenerator(() => 'test-key-123');
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    const response = await client.post('/test', {});
    expect(response.config.headers['Idempotency-Key']).toBe('test-key-123');
  });

  it('should not inject Idempotency-Key when generator returns undefined', async () => {
    mod.setIdempotencyKeyGenerator(() => undefined);
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    const response = await client.post('/test', {});
    expect(response.config.headers['Idempotency-Key']).toBeUndefined();
  });

  it('should not inject Idempotency-Key when no generator is configured', async () => {
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    const response = await client.post('/test', {});
    expect(response.config.headers['Idempotency-Key']).toBeUndefined();
  });

  it('should pass the request config to the generator', async () => {
    const generator = vi.fn((_config: InternalAxiosRequestConfig) => 'key');
    mod.setIdempotencyKeyGenerator(generator);
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    await client.post('/test', {});
    expect(generator).toHaveBeenCalledOnce();
    expect(generator.mock.calls[0]![0]).toHaveProperty('method');
  });
});

describe('createMutator', () => {
  let mod: ApiClientModule;

  beforeEach(async () => {
    vi.resetModules();
    mod = await import('../index.ts');
  });

  it('should return response data instead of the full AxiosResponse', async () => {
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = () =>
      Promise.resolve({
        data: { id: 1, name: 'test' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      });

    const mutator = mod.createMutator(client);
    const result = await mutator<{ id: number; name: string }>({ url: '/test', method: 'GET' });
    expect(result).toEqual({ id: 1, name: 'test' });
  });

  it('should merge config and options', async () => {
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    let capturedConfig: Record<string, unknown> = {};
    client.defaults.adapter = (config) => {
      capturedConfig = config as unknown as Record<string, unknown>;
      return Promise.resolve({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config as InternalAxiosRequestConfig,
      });
    };

    const mutator = mod.createMutator(client);
    await mutator({ url: '/test', method: 'GET' }, { params: { page: 1 } });
    expect(capturedConfig.params).toEqual({ page: 1 });
  });

  it('should propagate errors from the axios instance', async () => {
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = () => Promise.reject(new Error('Network Error'));

    const mutator = mod.createMutator(client);
    await expect(mutator({ url: '/test', method: 'GET' })).rejects.toThrow('Network Error');
  });
});

describe('401 response interceptor', () => {
  let mod: ApiClientModule;

  beforeEach(async () => {
    vi.resetModules();
    mod = await import('../index.ts');
  });

  it('should call onUnauthorized callback on 401 response', async () => {
    const callback = vi.fn();
    mod.setOnUnauthorized(callback);
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = rejectAdapter(401);

    await expect(client.get('/test')).rejects.toBeDefined();
    expect(callback).toHaveBeenCalledOnce();
  });

  it('should not call onUnauthorized when no callback is registered', async () => {
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = rejectAdapter(401);

    await expect(client.get('/test')).rejects.toBeDefined();
    // No callback registered — should not throw
  });

  it('should not call onUnauthorized on 403 response', async () => {
    const callback = vi.fn();
    mod.setOnUnauthorized(callback);
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = rejectAdapter(403);

    await expect(client.get('/test')).rejects.toBeDefined();
    expect(callback).not.toHaveBeenCalled();
  });

  it('should still propagate the error after calling onUnauthorized', async () => {
    mod.setOnUnauthorized(vi.fn());
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = rejectAdapter(401);

    await expect(client.get('/test')).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it('should pass through successful responses unchanged', async () => {
    mod.setOnUnauthorized(vi.fn());
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    client.defaults.adapter = captureAdapter;

    const response = await client.get('/test');
    expect(response.status).toBe(200);
  });
});

describe('BFF mode', () => {
  let mod: ApiClientModule;

  beforeEach(async () => {
    vi.resetModules();
    mod = await import('../index.ts');
  });

  it('should set withCredentials to true in BFF mode', () => {
    const client = mod.createApiClient({
      baseURL: 'https://api.example.com',
      mode: 'bff',
    });
    expect(client.defaults.withCredentials).toBe(true);
  });

  it('should not set withCredentials in bearer mode', () => {
    const client = mod.createApiClient({
      baseURL: 'https://api.example.com',
      mode: 'bearer',
    });
    expect(client.defaults.withCredentials).toBe(false);
  });

  it('should not set withCredentials when mode is omitted (default bearer)', () => {
    const client = mod.createApiClient({ baseURL: 'https://api.example.com' });
    expect(client.defaults.withCredentials).toBe(false);
  });

  it('should inject X-CSRF-Token on POST requests in BFF mode', async () => {
    const client = mod.createApiClient({
      baseURL: 'https://api.example.com',
      mode: 'bff',
      csrfTokenGetter: () => 'csrf-123',
    });
    client.defaults.adapter = captureAdapter;

    const response = await client.post('/test', {});
    expect(response.config.headers['X-CSRF-Token']).toBe('csrf-123');
  });

  it('should inject X-CSRF-Token on PUT requests in BFF mode', async () => {
    const client = mod.createApiClient({
      baseURL: 'https://api.example.com',
      mode: 'bff',
      csrfTokenGetter: () => 'csrf-put',
    });
    client.defaults.adapter = captureAdapter;

    const response = await client.put('/test', {});
    expect(response.config.headers['X-CSRF-Token']).toBe('csrf-put');
  });

  it('should inject X-CSRF-Token on DELETE requests in BFF mode', async () => {
    const client = mod.createApiClient({
      baseURL: 'https://api.example.com',
      mode: 'bff',
      csrfTokenGetter: () => 'csrf-del',
    });
    client.defaults.adapter = captureAdapter;

    const response = await client.delete('/test');
    expect(response.config.headers['X-CSRF-Token']).toBe('csrf-del');
  });

  it('should inject X-CSRF-Token on PATCH requests in BFF mode', async () => {
    const client = mod.createApiClient({
      baseURL: 'https://api.example.com',
      mode: 'bff',
      csrfTokenGetter: () => 'csrf-patch',
    });
    client.defaults.adapter = captureAdapter;

    const response = await client.patch('/test', {});
    expect(response.config.headers['X-CSRF-Token']).toBe('csrf-patch');
  });

  it('should NOT inject X-CSRF-Token on GET requests in BFF mode', async () => {
    const client = mod.createApiClient({
      baseURL: 'https://api.example.com',
      mode: 'bff',
      csrfTokenGetter: () => 'csrf-get',
    });
    client.defaults.adapter = captureAdapter;

    const response = await client.get('/test');
    expect(response.config.headers['X-CSRF-Token']).toBeUndefined();
  });

  it('should NOT inject X-CSRF-Token when csrfTokenGetter returns null', async () => {
    const warnSpy = vi.spyOn(globalThis.console, 'warn').mockImplementation(() => undefined);
    const client = mod.createApiClient({
      baseURL: 'https://api.example.com',
      mode: 'bff',
      csrfTokenGetter: () => null,
    });
    client.defaults.adapter = captureAdapter;

    const response = await client.post('/test', {});
    expect(response.config.headers['X-CSRF-Token']).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('BFF mutation sent without X-CSRF-Token')
    );
    warnSpy.mockRestore();
  });

  it('should self-heal: await refreshCsrfToken when cached token is null', async () => {
    const refreshCsrfToken = vi.fn().mockResolvedValue('fresh-csrf');
    const client = mod.createApiClient({
      baseURL: 'https://api.example.com',
      mode: 'bff',
      csrfTokenGetter: () => null,
      refreshCsrfToken,
    });
    client.defaults.adapter = captureAdapter;

    const response = await client.post('/test', {});
    expect(refreshCsrfToken).toHaveBeenCalledOnce();
    expect(response.config.headers['X-CSRF-Token']).toBe('fresh-csrf');
  });

  it('should prefer the cached token over the refresh callback when available', async () => {
    const refreshCsrfToken = vi.fn().mockResolvedValue('refreshed');
    const client = mod.createApiClient({
      baseURL: 'https://api.example.com',
      mode: 'bff',
      csrfTokenGetter: () => 'cached',
      refreshCsrfToken,
    });
    client.defaults.adapter = captureAdapter;

    const response = await client.post('/test', {});
    expect(refreshCsrfToken).not.toHaveBeenCalled();
    expect(response.config.headers['X-CSRF-Token']).toBe('cached');
  });

  it('should NOT inject Authorization header in BFF mode', async () => {
    mod.setTokenGetter(() => Promise.resolve('should-not-appear'));
    const client = mod.createApiClient({
      baseURL: 'https://api.example.com',
      mode: 'bff',
    });
    client.defaults.adapter = captureAdapter;

    const response = await client.get('/test');
    expect(response.config.headers.Authorization).toBeUndefined();
  });

  it('should still inject X-Tenant-Id in BFF mode', async () => {
    mod.setTenantGetter(() => 'tenant-bff');
    const client = mod.createApiClient({
      baseURL: 'https://api.example.com',
      mode: 'bff',
    });
    client.defaults.adapter = captureAdapter;

    const response = await client.get('/test');
    expect(response.config.headers['X-Tenant-Id']).toBe('tenant-bff');
  });

  it('should still inject Idempotency-Key in BFF mode', async () => {
    mod.setIdempotencyKeyGenerator(() => 'idem-bff');
    const client = mod.createApiClient({
      baseURL: 'https://api.example.com',
      mode: 'bff',
    });
    client.defaults.adapter = captureAdapter;

    const response = await client.post('/test', {});
    expect(response.config.headers['Idempotency-Key']).toBe('idem-bff');
  });
});
