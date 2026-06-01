import { describe, expect, it } from 'vitest';

import { detectVersionDrift } from '../detect-version-drift';

describe('detectVersionDrift', () => {
  it('returns ad-hoc when the persisted instance has no source version', () => {
    expect(detectVersionDrift(null, '1.0.0')).toBe('ad-hoc');
    expect(detectVersionDrift(null, undefined)).toBe('ad-hoc');
  });

  it('returns unknown when the catalog does not expose the source definition', () => {
    expect(detectVersionDrift('1.0.0', undefined)).toBe('unknown');
  });

  it('returns aligned when persisted matches catalog exactly', () => {
    expect(detectVersionDrift('1.0.0', '1.0.0')).toBe('aligned');
    expect(detectVersionDrift('2.5.3', '2.5.3')).toBe('aligned');
  });

  it('returns behind when persisted is older than catalog', () => {
    expect(detectVersionDrift('1.0.0', '1.0.1')).toBe('behind');
    expect(detectVersionDrift('1.0.0', '1.1.0')).toBe('behind');
    expect(detectVersionDrift('1.9.9', '2.0.0')).toBe('behind');
    expect(detectVersionDrift('0.5.0', '1.0.0')).toBe('behind');
  });

  it('returns ahead when persisted is newer than catalog', () => {
    expect(detectVersionDrift('1.0.1', '1.0.0')).toBe('ahead');
    expect(detectVersionDrift('1.1.0', '1.0.5')).toBe('ahead');
    expect(detectVersionDrift('2.0.0', '1.9.9')).toBe('ahead');
  });

  it('compares semver components numerically (10 > 9, not lexically)', () => {
    expect(detectVersionDrift('1.10.0', '1.9.0')).toBe('ahead');
    expect(detectVersionDrift('1.0.10', '1.0.9')).toBe('ahead');
  });

  it('returns aligned for identical non-conventional version strings', () => {
    // Pre-release tags / build metadata: equality short-circuits the
    // semver parse so these still register as aligned.
    expect(detectVersionDrift('1.0.0-alpha.3', '1.0.0-alpha.3')).toBe('aligned');
    expect(detectVersionDrift('custom', 'custom')).toBe('aligned');
  });

  it('returns unknown for non-conventional differing version strings (cannot order safely)', () => {
    expect(detectVersionDrift('1.0.0-alpha', '1.0.0-beta')).toBe('unknown');
    expect(detectVersionDrift('custom-a', 'custom-b')).toBe('unknown');
  });
});
