export type ApiKeyStatus = 'active' | 'revoked' | 'expired';

export function getApiKeyStatus(revokedAt: string | null, expiresAt: string | null): ApiKeyStatus {
  if (revokedAt) return 'revoked';
  if (expiresAt && new Date(expiresAt) < new Date()) return 'expired';
  return 'active';
}
