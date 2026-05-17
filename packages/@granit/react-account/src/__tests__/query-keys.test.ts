import { describe, expect, it } from 'vitest';

import { accountKeys } from '../hooks/query-keys.js';

describe('accountKeys', () => {
  it('should return base key for all', () => {
    expect(accountKeys.all).toEqual(['account']);
  });

  it('should return profile key', () => {
    expect(accountKeys.profile()).toEqual(['account', 'profile']);
  });

  it('should return two-factor key', () => {
    expect(accountKeys.twoFactor()).toEqual(['account', 'two-factor']);
  });

  it('should return authenticator-key nested under two-factor', () => {
    expect(accountKeys.authenticatorKey()).toEqual([
      'account',
      'two-factor',
      'authenticator-key',
    ]);
  });

  it('should return external-logins key', () => {
    expect(accountKeys.externalLogins()).toEqual(['account', 'external-logins']);
  });

  it('should return passkeys key', () => {
    expect(accountKeys.passkeys()).toEqual(['account', 'passkeys']);
  });
});
