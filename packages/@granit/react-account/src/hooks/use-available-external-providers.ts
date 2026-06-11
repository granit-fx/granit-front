import { useAccountSettings } from './use-account-settings';

import type { ExternalLoginProvider } from '@granit/account';

/** Stable empty reference so consumers don't re-render while the config loads. */
const NO_PROVIDERS: readonly ExternalLoginProvider[] = [];

export interface AvailableExternalProviders {
  /** Providers advertised by `GET /config` — empty while loading or when none exist. */
  readonly providers: readonly ExternalLoginProvider[];
  readonly isLoading: boolean;
}

/**
 * Selector over {@link useAccountSettings} exposing the external login providers
 * available on the anonymous sign-in screen (`config.externalProviders`).
 *
 * The list is the backend's source of truth — there is no hardcoded provider
 * registry. Each entry carries the scheme `name` (passed to
 * `useChallengeExternalLogin`), a `type` (for branding) and a `displayName`
 * (button label). Returns an empty list until the config query resolves, so UIs
 * render no buttons rather than a flash of a static fallback.
 */
export function useAvailableExternalProviders(): AvailableExternalProviders {
  const { data, isLoading } = useAccountSettings();
  return { providers: data?.externalProviders ?? NO_PROVIDERS, isLoading };
}
