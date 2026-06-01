import { describe, expect, it } from 'vitest';

import { formatBytes } from '../components/format-bytes';

describe('formatBytes', () => {
  it('returns 0 B for zero', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('returns 0 B for negative inputs', () => {
    expect(formatBytes(-5)).toBe('0 B');
  });

  it('returns 0 B for non-finite inputs', () => {
    expect(formatBytes(Number.NaN)).toBe('0 B');
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe('0 B');
  });

  it('returns raw bytes under 1024', () => {
    expect(formatBytes(1)).toBe('1 B');
    expect(formatBytes(1023)).toBe('1023 B');
  });

  it('switches to KB at 1024', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
  });

  it('formats megabytes with one decimal', () => {
    expect(formatBytes(1024 * 1024 * 5)).toBe('5.0 MB');
  });

  it('formats 1.5 GB', () => {
    expect(formatBytes(1024 * 1024 * 1024 * 1.5)).toBe('1.5 GB');
  });

  it('formats terabytes', () => {
    expect(formatBytes(1024 ** 4 * 2)).toBe('2.0 TB');
  });

  it('caps at petabytes', () => {
    expect(formatBytes(1024 ** 5 * 3)).toBe('3.0 PB');
  });
});
