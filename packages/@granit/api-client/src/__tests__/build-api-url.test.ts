import { describe, expect, it } from 'vitest';
import { buildApiUrl } from '../index.ts';

describe('buildApiUrl', () => {
  it('returns basePath unchanged when no segments are provided', () => {
    expect(buildApiUrl('/api')).toBe('/api');
  });

  it('joins basePath with a single segment', () => {
    expect(buildApiUrl('/api', 'notifications')).toBe('/api/notifications');
  });

  it('joins basePath with multiple segments', () => {
    expect(buildApiUrl('/api', 'notifications', 'unread', 'count')).toBe(
      '/api/notifications/unread/count',
    );
  });

  it('preserves pre-encoded segments', () => {
    const entityType = encodeURIComponent('My Entity');
    const entityId = encodeURIComponent('abc/123');
    expect(buildApiUrl('/api', entityType, entityId, 'history')).toBe(
      '/api/My%20Entity/abc%2F123/history',
    );
  });
});
