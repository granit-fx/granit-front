import { createMswServer } from '@granit/testing/msw';
import { describe, expect, it } from 'vitest';

import { createTemplatesHandlers, templateQueryMetadata } from '../testing/index';

const BASE = 'http://api.test/api/v1/templating';
const server = createMswServer();

describe('createTemplatesHandlers /meta', () => {
  it('responds with templateQueryMetadata at /templates/meta', async () => {
    server.use(...createTemplatesHandlers(BASE));
    const response = await fetch(`${BASE}/templates/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(templateQueryMetadata);
  });
});
