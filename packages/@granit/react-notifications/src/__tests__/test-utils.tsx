export { axiosResponse, createMockClient } from '@granit/testing';

import { NotificationsProvider } from '../providers/notifications-provider';

import type { NotificationConfig } from '@granit/notifications';
import type { AxiosInstance } from 'axios';

export function createWrapper(client: AxiosInstance, basePath = '/api/v1') {
  return function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
    const config: NotificationConfig = {
      apiClient: client,
      basePath,
    };
    return <NotificationsProvider config={config}>{children}</NotificationsProvider>;
  };
}

/**
 * Creates a wrapper where `basePath` is omitted from the config,
 * exercising the `?? API_BASE_PATH` fallback in hooks.
 */
export function createWrapperWithoutBasePath(client: AxiosInstance) {
  return function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
    const config: NotificationConfig = { apiClient: client };
    return <NotificationsProvider config={config}>{children}</NotificationsProvider>;
  };
}
