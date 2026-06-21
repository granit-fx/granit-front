import type { AxiosInstance } from '@granit/api-client';
import { createMockClient } from '@granit/testing';

import { installForbiddenRedirectInterceptor } from '../api-interceptors';

type RejectionHandler = (error: unknown) => Promise<unknown>;

function captureRejectionHandler(client: AxiosInstance): RejectionHandler {
  const use = client.interceptors.response.use as unknown as ReturnType<typeof vi.fn>;
  const handler = use.mock.calls[0]?.[1];
  if (typeof handler !== 'function') throw new Error('no rejection handler registered');
  return handler as RejectionHandler;
}

function axiosError(status: number, url?: string) {
  return { isAxiosError: true, response: { status }, config: { url } };
}

describe('installForbiddenRedirectInterceptor', () => {
  it('registers a single response interceptor', () => {
    const client = createMockClient();
    installForbiddenRedirectInterceptor(client, { onForbidden: vi.fn() });
    expect(client.interceptors.response.use).toHaveBeenCalledTimes(1);
  });

  it('invokes onForbidden with the request url on an unsuppressed 403', async () => {
    const client = createMockClient();
    const onForbidden = vi.fn();
    installForbiddenRedirectInterceptor(client, { onForbidden });
    const handler = captureRejectionHandler(client);
    const error = axiosError(403, '/api/v1/users');

    await expect(handler(error)).rejects.toBe(error);
    expect(onForbidden).toHaveBeenCalledWith('/api/v1/users');
  });

  it('suppresses the redirect for background endpoints', async () => {
    const client = createMockClient();
    const onForbidden = vi.fn();
    const logger = { warn: vi.fn() };
    installForbiddenRedirectInterceptor(client, {
      onForbidden,
      suppressPatterns: [/\/api\/v1\/notifications/],
      logger,
    });
    const handler = captureRejectionHandler(client);
    const error = axiosError(403, '/api/v1/notifications');

    await expect(handler(error)).rejects.toBe(error);
    expect(onForbidden).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });

  it('ignores non-403 axios errors', async () => {
    const client = createMockClient();
    const onForbidden = vi.fn();
    installForbiddenRedirectInterceptor(client, { onForbidden });
    const handler = captureRejectionHandler(client);
    const error = axiosError(500, '/api/v1/users');

    await expect(handler(error)).rejects.toBe(error);
    expect(onForbidden).not.toHaveBeenCalled();
  });

  it('ignores non-axios errors', async () => {
    const client = createMockClient();
    const onForbidden = vi.fn();
    installForbiddenRedirectInterceptor(client, { onForbidden });
    const handler = captureRejectionHandler(client);
    const error = new Error('network down');

    await expect(handler(error)).rejects.toBe(error);
    expect(onForbidden).not.toHaveBeenCalled();
  });

  it('passes successful responses through untouched', () => {
    const client = createMockClient();
    installForbiddenRedirectInterceptor(client, { onForbidden: vi.fn() });
    const use = client.interceptors.response.use as unknown as ReturnType<typeof vi.fn>;
    const onFulfilled = use.mock.calls[0]?.[0] as (r: unknown) => unknown;
    const response = { status: 200, data: 'ok' };
    expect(onFulfilled(response)).toBe(response);
  });
});
