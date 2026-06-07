import { DEFAULT_BASE_PATH } from '../constants';
import { useOptionalAuthorizationConfig } from '../providers/authorization-provider';

import type { AxiosInstance } from '@granit/api-client';

interface ConfigInput {
  readonly client?: AxiosInstance;
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

interface ResolvedConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix?: readonly string[];
}

export function useResolvedAuthorizationConfig(options: ConfigInput = {}): ResolvedConfig {
  const ctx = useOptionalAuthorizationConfig();
  const client = options.client ?? ctx?.client;
  if (!client) {
    throw new Error(
      'Authorization hooks require an Axios client. Provide it via options.client or wrap your app in <AuthorizationProvider>.'
    );
  }
  return {
    client,
    basePath: options.basePath ?? ctx?.basePath ?? DEFAULT_BASE_PATH,
    queryKeyPrefix: options.queryKeyPrefix ?? ctx?.queryKeyPrefix,
  };
}
