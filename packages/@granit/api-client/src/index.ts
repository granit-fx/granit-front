import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

import { logger as fallbackLogger } from './logger';

import type { Logger } from '@granit/logger';


/** Authentication mode for the API client. */
export type ApiClientMode = 'bearer' | 'bff';

/** HTTP transport adapter for the API client. */
export type ApiClientTransport = 'xhr' | 'fetch';

/**
 * Per-request options forwarded verbatim into the fetch adapter's `RequestInit`
 * (no-op unless the client is created with `transport: 'fetch'`). Stays neutral
 * vis-à-vis the consuming framework: SSR caching hints such as Next.js' `next`
 * field (`{ next: { revalidate, tags } }`) only materialise in apps that augment
 * the global `RequestInit` (via `next-env.d.ts`) — this package never declares
 * them. `method` and `body` are omitted on purpose: axios' fetch adapter spreads
 * `fetchOptions` last into the request init, so allowing them would let a caller
 * silently clobber the request axios already built.
 */
export type RequestFetchOptions = Omit<RequestInit, 'method' | 'body'>;

/** Getter that returns the current CSRF token, or null if unavailable. */
export type CsrfTokenGetter = () => string | null;

export interface ApiClientConfig {
  baseURL: string;
  /** Request timeout in milliseconds. Default: 10_000 */
  timeout?: number;
  /**
   * Authentication mode. Default: `'bearer'`.
   *
   * - `'bearer'` — Injects `Authorization: Bearer <token>` via the global token getter.
   * - `'bff'` — Uses `withCredentials` (cookies) and injects `X-CSRF-Token` on mutations.
   *   No Authorization header is sent (the BFF YARP proxy adds it server-side).
   */
  mode?: ApiClientMode;
  /**
   * HTTP transport adapter. Default: `'xhr'` (axios' default — unchanged behaviour).
   *
   * - `'xhr'` — XMLHttpRequest in the browser, http(s) module under Node.
   * - `'fetch'` — routes through the global `fetch`, letting per-request
   *   `fetchOptions` (see {@link RequestFetchOptions}) reach the runtime's fetch.
   *   Required for SSR consumers (e.g. Next.js) that rely on a patched global
   *   `fetch` for caching / revalidation.
   */
  transport?: ApiClientTransport;
  /**
   * CSRF token getter for BFF mode. Required when `mode` is `'bff'`.
   * Typically obtained from `CsrfManager.getToken` in `@granit/bff`.
   */
  csrfTokenGetter?: CsrfTokenGetter;
  /**
   * Optional async fetch-and-cache callback invoked when a BFF mutation is
   * about to be sent and `csrfTokenGetter()` returns `null` (bootstrap race
   * window). Typically `csrfManager.fetchToken` from `@granit/bff`. When
   * provided, the interceptor awaits a fresh token instead of sending the
   * request without `X-CSRF-Token`, eliminating defense-in-depth gaps.
   */
  refreshCsrfToken?: () => Promise<string | null>;
  /**
   * Optional logger from `@granit/logger`. Used to report interceptor-level
   * warnings (e.g. missing CSRF token on a BFF mutation). When omitted, the
   * client falls back to `console.warn` so framework-level diagnostics are
   * never lost — but production apps should always wire a redacting logger
   * to keep PII out of `console` and route diagnostics to OTLP.
   */
  logger?: Logger;
}

// ---------------------------------------------------------------------------
// Generic response types (REST APIs)
// ---------------------------------------------------------------------------

// RFC 7807 Problem Details — standard error format from Granit .NET backend.
// See: Granit.Http.ExceptionHandling (400 BusinessException, 404 NotFoundException,
// 403 ForbiddenException, 409 ConflictException, 422 ValidationException, 500).
//
// Re-exported from errors.ts as ProblemDetailsPayload (readonly variant for
// error classes). This mutable variant is kept for backward compatibility
// with consumers that import `ProblemDetails` from `@granit/api-client`.
export type { ProblemDetailsPayload as ProblemDetails } from './errors';

// Global async token getter — shared across all createApiClient instances.
// Call setTokenGetter() from the auth provider after Keycloak initializes.
let _tokenGetter: (() => Promise<string | undefined>) | null = null;

// Global synchronous tenant getter — opt-in for multi-tenant apps.
// Call setTenantGetter() from the app initialization code.
let _tenantGetter: (() => string | undefined) | null = null;

// Global callback invoked on any 401 response — wired by @granit/react-authentication to force logout.
let _onUnauthorized: (() => void) | null = null;

// Global idempotency key generator — opt-in via @granit/idempotency.
// When set, mutation requests (POST/PUT/PATCH/DELETE) automatically receive
// an Idempotency-Key header. The generator receives the request config and
// returns a key string, or undefined to skip the header for that request.
let _idempotencyKeyGenerator: ((config: InternalAxiosRequestConfig) => string | undefined) | null =
  null;

/**
 * In development, warn when a global setter is re-wired. A second call usually
 * means an unintended override (provider double-mount, supply-chain hijack
 * attempt, or competing auth providers). Production stays silent.
 */
function warnIfAlreadySet(name: string, previous: unknown): void {
  if (previous === null) return;
  const env = (import.meta as { env?: { DEV?: boolean } }).env;
  if (env?.DEV !== true) return;
  fallbackLogger.warn(
    `[@granit/api-client] ${name} called more than once — the previous getter has been replaced. ` +
      `Check for provider double-mount or unintended override.`
  );
}

export function setTokenGetter(getter: () => Promise<string | undefined>): void {
  warnIfAlreadySet('setTokenGetter', _tokenGetter);
  _tokenGetter = getter;
}

export function setTenantGetter(getter: () => string | undefined): void {
  warnIfAlreadySet('setTenantGetter', _tenantGetter);
  _tenantGetter = getter;
}

/**
 * Register a callback invoked on any HTTP 401 response.
 *
 * Typically wired by `@granit/react-authentication` to force a Keycloak logout when the
 * backend rejects a token (e.g. session revoked via back-channel logout).
 */
export function setOnUnauthorized(callback: () => void): void {
  warnIfAlreadySet('setOnUnauthorized', _onUnauthorized);
  _onUnauthorized = callback;
}

/**
 * Register a synchronous idempotency key generator for mutation requests.
 *
 * When set, POST/PUT/PATCH/DELETE requests receive an `Idempotency-Key` header.
 * Typically wired by `@granit/idempotency` during app initialization.
 *
 * @param generator - Receives the request config, returns a key string or
 *   `undefined` to skip the header for that specific request.
 */
export function setIdempotencyKeyGenerator(
  generator: (config: InternalAxiosRequestConfig) => string | undefined
): void {
  warnIfAlreadySet('setIdempotencyKeyGenerator', _idempotencyKeyGenerator);
  _idempotencyKeyGenerator = generator;
}

const MUTATION_METHODS = new Set(['post', 'put', 'delete', 'patch']);

/**
 * Inject the CSRF token into a BFF mutation request.
 *
 * Falls back to `refreshCsrfToken` when the cached token is not yet available
 * (bootstrap race). Emits a warning when neither getter produces a token but
 * at least one was configured — the request would be rejected by the BFF.
 */
async function injectBffHeaders(
  req: InternalAxiosRequestConfig,
  config: ApiClientConfig
): Promise<void> {
  if (!MUTATION_METHODS.has(req.method ?? '')) return;

  let csrfToken = config.csrfTokenGetter?.() ?? null;
  if (!csrfToken && config.refreshCsrfToken) {
    csrfToken = await config.refreshCsrfToken();
  }

  if (csrfToken) {
    req.headers['X-CSRF-Token'] = csrfToken;
    return;
  }

  if (config.csrfTokenGetter || config.refreshCsrfToken) {
    const message =
      '[@granit/api-client] BFF mutation sent without X-CSRF-Token — token unavailable. Request will likely be rejected by the BFF.';
    (config.logger ?? fallbackLogger).warn(message, { method: req.method, url: req.url });
  }
}

/**
 * Create a pre-configured Axios instance.
 *
 * - **Bearer mode** (default): injects `Authorization: Bearer <token>` via the global token getter.
 * - **BFF mode**: uses `withCredentials` (cookies) and injects `X-CSRF-Token` on mutations.
 *
 * Both modes support optional `X-Tenant-Id`, idempotency keys, and a 401 response interceptor.
 */
export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const mode = config.mode ?? 'bearer';
  const isBff = mode === 'bff';

  const instance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout ?? 10_000,
    withCredentials: isBff,
    // Opt-in fetch adapter: required for SSR consumers that depend on a patched
    // global fetch (per-request `fetchOptions` only take effect with this adapter).
    ...(config.transport === 'fetch' ? { adapter: 'fetch' as const } : {}),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(
    async (req: InternalAxiosRequestConfig) => {
      if (isBff) {
        // BFF mode: inject CSRF token on mutation methods.
        await injectBffHeaders(req, config);
      } else if (_tokenGetter) {
        // Bearer mode: inject Authorization header
        const token = await _tokenGetter();
        if (token) {
          req.headers.Authorization = `Bearer ${token}`;
        }
      }

      const tenantId = _tenantGetter?.();
      if (tenantId) {
        req.headers['X-Tenant-Id'] = tenantId;
      }

      const idempotencyKey = _idempotencyKeyGenerator?.(req);
      if (idempotencyKey) {
        req.headers['Idempotency-Key'] = idempotencyKey;
      }

      return req;
    },
    /* v8 ignore next 3 */
    (error: unknown) => {
      throw error;
    }
  );

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401 && _onUnauthorized) {
        _onUnauthorized();
      }
      throw error;
    }
  );

  return instance;
}

/**
 * Create an orval-compatible mutator function from an existing Axios instance.
 *
 * The returned function matches the orval custom instance signature:
 * `<T>(config: AxiosRequestConfig, options?: AxiosRequestConfig) => Promise<T>`
 *
 * It reuses the instance's interceptors (token injection, tenant header, etc.).
 *
 * @example
 * ```typescript
 * // src/api/mutator.ts (in consuming app)
 * import { api } from '@/lib/api';
 * import { createMutator } from '@granit/api-client';
 *
 * export const customInstance = createMutator(api);
 * export default customInstance;
 * ```
 */
export function createMutator(instance: AxiosInstance) {
  return <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> => {
    return instance({ ...config, ...options }).then(({ data }) => data as T);
  };
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

/**
 * Join a base API path with additional path segments.
 *
 * Segments are joined with `/` as-is — callers are responsible for
 * encoding dynamic values with `encodeURIComponent` before passing them.
 *
 * @example
 * ```ts
 * buildApiUrl(basePath, 'notifications', 'unread', 'count');
 * // => `${basePath}/notifications/unread/count`
 *
 * buildApiUrl(basePath, encodeURIComponent(entityType), encodeURIComponent(entityId), 'history');
 * // => `${basePath}/{entityType}/{entityId}/history`
 * ```
 */
export function buildApiUrl(basePath: string, ...segments: string[]): string {
  return [basePath, ...segments].join('/');
}

// ---------------------------------------------------------------------------
// Domain error classes
// ---------------------------------------------------------------------------

export {
  ConcurrencyConflictError,
  getHttpStatus,
  HttpError,
  isBackendUnavailable,
  isConcurrencyConflict,
  TimeoutError,
  ValidationError,
} from './errors';
export type { ProblemDetailsPayload, ValidationDetails } from './errors';

// Idempotency tombstone + replay helpers — see ./idempotency.ts.
export {
  isIdempotencyTombstoned,
  readIdempotencyTombstone,
  isIdempotentReplay,
} from './idempotency';
export type { IdempotencyTombstoneInfo } from './idempotency';

// ---------------------------------------------------------------------------
// Axios type façade — single entry point for the framework
// ---------------------------------------------------------------------------
// All Granit packages MUST import these types from `@granit/api-client`,
// never directly from `axios`. This keeps the HTTP client implementation
// behind a single seam: future swaps, branding, or interceptor contracts can
// land here without touching every consumer.
//
// The ESLint rule `no-restricted-imports` enforces this — see eslint.config.mjs.

export type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
export { isAxiosError } from 'axios';
