import { describe, expect, it } from 'vitest';

import {
  API_KEY_ENVIRONMENTS,
  API_KEY_TYPES,
  CACHE_BEHAVIORS,
  DEFAULT_PAGE_SIZE,
} from '../constants';

describe('API_KEY_TYPES', () => {
  it('should contain all expected types', () => {
    expect(API_KEY_TYPES).toContain('Secret');
    expect(API_KEY_TYPES).toContain('Publishable');
    expect(API_KEY_TYPES).toContain('Webhook');
    expect(API_KEY_TYPES).toContain('Ephemeral');
  });

  it('should have exactly 4 types', () => {
    expect(API_KEY_TYPES).toHaveLength(4);
  });
});

describe('API_KEY_ENVIRONMENTS', () => {
  it('should contain all expected environments', () => {
    expect(API_KEY_ENVIRONMENTS).toContain('live');
    expect(API_KEY_ENVIRONMENTS).toContain('test');
    expect(API_KEY_ENVIRONMENTS).toContain('dev');
  });

  it('should have exactly 3 environments', () => {
    expect(API_KEY_ENVIRONMENTS).toHaveLength(3);
  });
});

describe('CACHE_BEHAVIORS', () => {
  it('should contain Normal and NoCache', () => {
    expect(CACHE_BEHAVIORS).toContain('Normal');
    expect(CACHE_BEHAVIORS).toContain('NoCache');
  });

  it('should have exactly 2 behaviors', () => {
    expect(CACHE_BEHAVIORS).toHaveLength(2);
  });
});

describe('DEFAULT_PAGE_SIZE', () => {
  it('should be 20', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(20);
  });
});
