import { useOptionalGranitClient } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';
import { useOptionalApiKeysConfig } from '../providers/api-keys-provider';

import type { AxiosInstance } from '@granit/api-client';

interface ConfigInput {
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

interface ResolvedConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * Resolves the effective api-keys config for a hook. The Axios client and
 * defaults come from the nearest `<ApiKeysProvider>` when present, otherwise
 * the client falls back to the nearest `<GranitClientProvider>`. `basePath` and
 * `queryKeyPrefix` may be overridden per call.
 */
export function useResolvedApiKeysConfig(options: ConfigInput = {}): ResolvedConfig {
  const ctx = useOptionalApiKeysConfig();
  const contextClient = useOptionalGranitClient();
  const client = ctx?.client ?? contextClient;
  if (!client) {
    throw new Error(
      'API key hooks require an Axios client. Wrap your app in an <ApiKeysProvider> or a <GranitClientProvider>.'
    );
  }
  return {
    client,
    basePath: options.basePath ?? ctx?.basePath ?? DEFAULT_BASE_PATH,
    queryKeyPrefix: options.queryKeyPrefix ?? ctx?.queryKeyPrefix,
  };
}
