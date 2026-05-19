import { describe, expect, it } from 'vitest';

import { API_VERSION, DEFAULT_BASE_PATH, MODULE } from '../constants.js';

describe('react-diagnostics constants', () => {
  it('exposes the v1 API path under /api/v1/diagnostics', () => {
    expect(API_VERSION).toBe('v1');
    expect(MODULE).toBe('diagnostics');
    expect(DEFAULT_BASE_PATH).toBe('/api/v1/diagnostics');
  });
});
