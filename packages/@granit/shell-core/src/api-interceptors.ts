import { isAxiosError, type AxiosInstance } from '@granit/api-client';

export interface ForbiddenRedirectOptions {
  /**
   * Called when a 403 is NOT suppressed. The app decides where to send the user
   * (e.g. navigate to its access-denied route) — no route literals live here.
   */
  onForbidden: (requestUrl: string | undefined) => void;
  /**
   * Request URLs matching any pattern are background calls (notification bell,
   * presence, …): a 403 there means a missing optional permission and must NOT
   * hijack the document, which would also abort in-flight lazy route chunks.
   */
  suppressPatterns?: readonly RegExp[];
  /** Optional logger for the suppressed / redirecting branches. */
  logger?: { warn: (message: string) => void };
}

/**
 * Install a response interceptor that routes HTTP 403 to an app-supplied
 * handler, suppressing background-endpoint 403s. Framework-agnostic (axios).
 * 401 handling stays with the auth layer (`setOnUnauthorized` in the client).
 */
export function installForbiddenRedirectInterceptor(
  client: AxiosInstance,
  options: ForbiddenRedirectOptions
): void {
  const { onForbidden, suppressPatterns = [], logger } = options;
  client.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (isAxiosError(error) && error.response?.status === 403) {
        const requestUrl = error.config?.url;
        if (suppressPatterns.some((re) => re.test(requestUrl ?? ''))) {
          logger?.warn(
            `[API] Forbidden on background endpoint (${requestUrl}) — suppressing redirect`
          );
        } else {
          logger?.warn('[API] Forbidden — insufficient permissions, invoking onForbidden');
          onForbidden(requestUrl);
        }
      }
      throw error;
    }
  );
}
