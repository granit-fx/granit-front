import type { AxiosInstance } from '@granit/api-client';

/** Options for {@link searchLookup} and {@link resolveLookup}. */
export interface LookupClientOptions {
  /** Axios instance used for HTTP requests. */
  readonly client: AxiosInstance;
  /** Override the base path. Default: {@link DEFAULT_LOOKUP_BASE_PATH}. */
  readonly basePath?: string;
  /** Optional abort signal. */
  readonly signal?: AbortSignal;
}
