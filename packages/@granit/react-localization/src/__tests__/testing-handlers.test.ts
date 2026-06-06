import { createMswServer } from '@granit/testing/msw-server';
import { describe, expect, it } from 'vitest';

import { createLocalizationHandlers, localizationOverrideQueryMetadata } from '../testing/index';

const BASE = 'http://api.test/api/v1/localization';
const server = createMswServer();

describe('createLocalizationHandlers /meta', () => {
  it('responds with localizationOverrideQueryMetadata at /overrides/meta', async () => {
    server.use(...createLocalizationHandlers(BASE));
    const response = await fetch(`${BASE}/overrides/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(localizationOverrideQueryMetadata);
  });
});
