export { axiosResponse, createMockClient } from '@granit/testing';

import { NotificationProvider } from '../providers/notification-provider.js';

import type { NotificationConfig } from '@granit/notifications';
import type { AxiosInstance } from 'axios';

export function createWrapper(client: AxiosInstance, basePath = '/api/v1') {
  return function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
    const config: NotificationConfig = {
      apiClient: client,
      basePath,
    };
    return <NotificationProvider config={config}>{children}</NotificationProvider>;
  };
}

/**
 * Creates a wrapper where `basePath` is omitted from the config,
 * exercising the `?? API_BASE_PATH` fallback in hooks.
 */
export function createWrapperWithoutBasePath(client: AxiosInstance) {
  return function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
    const config: NotificationConfig = { apiClient: client };
    return <NotificationProvider config={config}>{children}</NotificationProvider>;
  };
}
