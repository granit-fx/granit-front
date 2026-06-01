import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createLocalizationHandlers, localizationOverrideQueryMetadata } from '../testing/index';

const BASE = 'http://api.test/api/v1/localization';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createLocalizationHandlers /meta', () => {
  it('responds with localizationOverrideQueryMetadata at /overrides/meta', async () => {
    server.use(...createLocalizationHandlers(BASE));
    const response = await fetch(`${BASE}/overrides/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(localizationOverrideQueryMetadata);
  });
});
