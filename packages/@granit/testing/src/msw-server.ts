import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';

import type { RequestHandler } from 'msw';

export interface MswServerOptions {
  /** How to handle unmatched requests. Defaults to `'error'` to surface missing handlers early. */
  onUnhandledRequest?: 'error' | 'warn' | 'bypass';
}

/**
 * Create an MSW server with standard Vitest lifecycle hooks wired up.
 * Listens with `onUnhandledRequest: 'error'` to catch missing handlers early.
 * Resets runtime handlers after each test and closes after the suite.
 */
export function createMswServer(
  options?: MswServerOptions,
  ...initialHandlers: RequestHandler[]
): ReturnType<typeof setupServer>;
export function createMswServer(
  ...initialHandlers: RequestHandler[]
): ReturnType<typeof setupServer>;
export function createMswServer(
  ...args: [MswServerOptions?, ...RequestHandler[]] | RequestHandler[]
): ReturnType<typeof setupServer> {
  const firstIsOptions =
    args.length > 0 && args[0] !== null && typeof args[0] === 'object' && !('resolver' in args[0]);
  const options = firstIsOptions ? (args[0] as MswServerOptions) : undefined;
  const handlers = firstIsOptions
    ? (args.slice(1) as RequestHandler[])
    : (args as RequestHandler[]);
  const server = setupServer(...handlers);
  const onUnhandledRequest = options?.onUnhandledRequest ?? 'error';
  beforeAll(() => server.listen({ onUnhandledRequest }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  return server;
}
