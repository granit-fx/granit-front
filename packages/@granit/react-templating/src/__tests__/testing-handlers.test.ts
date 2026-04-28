import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createTemplatesHandlers, templateQueryMetadata } from '../testing/index.js';

const BASE = 'http://api.test/api/v1/templating';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createTemplatesHandlers /meta', () => {
  it('responds with templateQueryMetadata at /templates/meta', async () => {
    server.use(...createTemplatesHandlers(BASE));
    const response = await fetch(`${BASE}/templates/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(templateQueryMetadata);
  });
});
