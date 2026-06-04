/**
 * Query-key factory for local-account self-service queries.
 *
 * Mutations invalidate the relevant keys so dependent queries (profile,
 * two-factor status, passkeys) refetch automatically.
 */
const ROOT = ['authentication-local'] as const;

export const localAuthKeys = {
  all: ROOT,
  config: () => [...ROOT, 'config'] as const,
  profile: () => [...ROOT, 'profile'] as const,
  twoFactorStatus: () => [...ROOT, 'two-factor', 'status'] as const,
  authenticatorKey: () => [...ROOT, 'two-factor', 'authenticator-key'] as const,
  passkeys: () => [...ROOT, 'passkeys'] as const,
};
