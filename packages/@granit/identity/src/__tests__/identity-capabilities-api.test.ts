import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { getIdentityCapabilities } from '../api/identity-capabilities-api';

import type { IdentityProviderCapabilities } from '../types/index';

const keycloakCapabilities: IdentityProviderCapabilities = {
  providerName: 'Keycloak',
  supportsIndividualSessionTermination: true,
  supportsNativePasswordResetEmail: true,
  supportsGroupHierarchy: true,
  supportsCustomAttributes: true,
  maxCustomAttributes: 2147483647,
  supportsCredentialVerification: true,
  supportsUserCreation: true,
  supportsGroupManagement: true,
};

describe('identity-capabilities-api', () => {
  it('should GET {basePath}/capabilities', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: keycloakCapabilities });

    const result = await getIdentityCapabilities(client, '/identity/users');

    expect(client.get).toHaveBeenCalledWith('/identity/users/capabilities');
    expect(result).toEqual(keycloakCapabilities);
  });

  it('should work with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: keycloakCapabilities });

    await getIdentityCapabilities(client, '/api/v1/identity');

    expect(client.get).toHaveBeenCalledWith('/api/v1/identity/capabilities');
  });

  it('should return Entra ID capabilities', async () => {
    const entraCapabilities: IdentityProviderCapabilities = {
      providerName: 'Entra ID',
      supportsIndividualSessionTermination: false,
      supportsNativePasswordResetEmail: false,
      supportsGroupHierarchy: false,
      supportsCustomAttributes: true,
      maxCustomAttributes: 15,
      supportsCredentialVerification: true,
      supportsUserCreation: true,
      supportsGroupManagement: false,
    };
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: entraCapabilities });

    const result = await getIdentityCapabilities(client, '/identity/users');

    expect(result.providerName).toBe('Entra ID');
    expect(result.supportsIndividualSessionTermination).toBe(false);
    expect(result.maxCustomAttributes).toBe(15);
  });
});
