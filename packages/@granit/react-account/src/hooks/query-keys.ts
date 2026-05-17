/** Query key factory for account queries. */
export const accountKeys = {
  all: ['account'] as const,
  profile: () => [...accountKeys.all, 'profile'] as const,
  twoFactor: () => [...accountKeys.all, 'two-factor'] as const,
  authenticatorKey: () => [...accountKeys.twoFactor(), 'authenticator-key'] as const,
  externalLogins: () => [...accountKeys.all, 'external-logins'] as const,
  passkeys: () => [...accountKeys.all, 'passkeys'] as const,
  settings: () => [...accountKeys.all, 'settings'] as const,
};
