import { describe, expect, it } from 'vitest';

import { openIddictAdminKeys } from '../hooks/query-keys.js';

describe('openIddictAdminKeys', () => {
  it('should return base key for all', () => {
    expect(openIddictAdminKeys.all).toEqual(['openiddict-admin']);
  });

  it('should return users key', () => {
    expect(openIddictAdminKeys.users()).toEqual(['openiddict-admin', 'users']);
  });

  it('should return applications key', () => {
    expect(openIddictAdminKeys.applications()).toEqual([
      'openiddict-admin',
      'oidc',
      'applications',
    ]);
  });

  it('should return scopes key', () => {
    expect(openIddictAdminKeys.scopes()).toEqual(['openiddict-admin', 'oidc', 'scopes']);
  });

  it('should return authorizations key', () => {
    expect(openIddictAdminKeys.authorizations()).toEqual([
      'openiddict-admin',
      'oidc',
      'authorizations',
    ]);
  });
});
