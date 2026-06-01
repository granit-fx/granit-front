import { describe, expect, it, vi } from 'vitest';

import { axiosResponse, createMockClient } from '../mock-client';

describe('createMockClient', () => {
  it('returns an object with all HTTP method stubs', () => {
    const client = createMockClient();

    for (const method of ['get', 'post', 'delete', 'put', 'patch', 'request', 'head', 'options']) {
      expect(client[method as keyof typeof client]).toEqual(expect.any(Function));
    }
  });

  it('returns an object with getUri stub', () => {
    const client = createMockClient();
    expect(client.getUri).toEqual(expect.any(Function));
  });

  it('returns an object with interceptor stubs', () => {
    const client = createMockClient();

    for (const kind of ['request', 'response'] as const) {
      expect(client.interceptors[kind].use).toEqual(expect.any(Function));
      expect(client.interceptors[kind].eject).toEqual(expect.any(Function));
      expect(client.interceptors[kind].clear).toEqual(expect.any(Function));
    }
  });

  it('allows mocking resolved values on HTTP methods', async () => {
    const client = createMockClient();
    const response = axiosResponse({ id: 1 });

    vi.mocked(client.get).mockResolvedValue(response);

    await expect(client.get('/test')).resolves.toEqual(response);
    expect(client.get).toHaveBeenCalledWith('/test');
  });
});

describe('axiosResponse', () => {
  it('wraps data in a minimal AxiosResponse shape', () => {
    const result = axiosResponse({ name: 'test' });

    expect(result).toEqual({
      data: { name: 'test' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });
  });

  it('preserves the exact data reference', () => {
    const data = { key: 'value' };
    const result = axiosResponse(data);

    expect(result.data).toBe(data);
  });

  it('works with primitive types', () => {
    expect(axiosResponse(42).data).toBe(42);
    expect(axiosResponse('hello').data).toBe('hello');
    expect(axiosResponse(null).data).toBeNull();
  });
});
