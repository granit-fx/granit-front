import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';

import type { RequestHandler } from 'msw';

/**
 * Create an MSW server with standard Vitest lifecycle hooks wired up.
 * Listens with `onUnhandledRequest: 'error'` to catch missing handlers early.
 * Resets runtime handlers after each test and closes after the suite.
 */
export function createMswServer(...initialHandlers: RequestHandler[]) {
  const server = setupServer(...initialHandlers);
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  return server;
}
