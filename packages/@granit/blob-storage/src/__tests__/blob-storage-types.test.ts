import { describe, expect, it } from 'vitest';

import { BlobStatus } from '../types/index';

describe('BlobStatus', () => {
  it('matches the wire format (PascalCase strings from JsonStringEnumConverter)', () => {
    expect(BlobStatus.Pending).toBe('Pending');
    expect(BlobStatus.Uploading).toBe('Uploading');
    expect(BlobStatus.Valid).toBe('Valid');
    expect(BlobStatus.Rejected).toBe('Rejected');
    expect(BlobStatus.Deleted).toBe('Deleted');
  });

  it('has exactly 5 members', () => {
    expect(Object.keys(BlobStatus)).toHaveLength(5);
  });
});
