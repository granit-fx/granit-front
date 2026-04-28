import { vi } from 'vitest';

import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from '@granit/api-client';

/**
 * Create a fully mocked AxiosInstance with vi.fn() stubs for all methods.
 * Useful for testing hooks and components that depend on an Axios client
 * without making real HTTP calls.
 */
export function createMockClient(): AxiosInstance {
  return {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    request: vi.fn(),
    head: vi.fn(),
    options: vi.fn(),
    getUri: vi.fn(),
    defaults: {} as AxiosInstance['defaults'],
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
    },
  } as unknown as AxiosInstance;
}

/**
 * Wrap arbitrary data in a minimal AxiosResponse shape.
 * Saves boilerplate when stubbing resolved values for mocked Axios methods.
 */
export function axiosResponse<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  };
}
