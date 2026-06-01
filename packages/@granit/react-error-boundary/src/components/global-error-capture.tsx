import * as React from 'react';

import type { GlobalErrorCaptureProps } from '../types/index';

/**
 * Invisible component that listens to `window.error` and
 * `window.unhandledrejection` events and logs them via `@granit/logger`.
 *
 * Deduplicates errors by message within a 1-second window.
 * Cleans up listeners on unmount.
 *
 * @example
 * ```tsx
 * <GlobalErrorCapture logger={logger} />
 * ```
 */
export function GlobalErrorCapture({ logger, onError }: GlobalErrorCaptureProps) {
  React.useEffect(() => {
    const recentErrors = new Set<string>();

    function isDuplicate(message: string): boolean {
      if (recentErrors.has(message)) return true;
      recentErrors.add(message);
      setTimeout(() => recentErrors.delete(message), 1000);
      return false;
    }

    function handleError(event: ErrorEvent) {
      const error =
        event.error instanceof Error ? event.error : new Error(event.message || 'Unknown error');

      if (isDuplicate(error.message)) return;

      logger.error('Uncaught error', error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });

      onError?.(error);
    }

    function handleRejection(event: PromiseRejectionEvent) {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason ?? 'Unhandled promise rejection'));

      if (isDuplicate(error.message)) return;

      logger.error('Unhandled promise rejection', error);

      onError?.(error);
    }

    globalThis.addEventListener('error', handleError);
    globalThis.addEventListener('unhandledrejection', handleRejection);

    return () => {
      globalThis.removeEventListener('error', handleError);
      globalThis.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [logger, onError]);

  return null;
}
