import { HttpError } from '@granit/api-client';
import { useChallengeExternalLogin } from '@granit/react-account';
import { useTranslation } from '@granit/react-localization';
import { toast, Button } from '@granit/react-ui';
import { useState } from 'react';

import { logger } from '../logger';

import { ExternalProviderIcon } from './external-provider-icon';
import {
  useAvailableExternalProviders,
  type ExternalLoginProvider,
} from './use-available-external-providers';

type ExternalLoginVariant = 'sign-in' | 'link';

interface ExternalLoginButtonsProps {
  /**
   * `sign-in` — anonymous login screen ("Continue with …").
   * `link` — authenticated account screen ("Link …"); already-linked providers
   * are filtered out via {@link ExternalLoginButtonsProps.linkedProviders}.
   */
  readonly variant: ExternalLoginVariant;
  /** Scheme names already linked (case-insensitive), hidden in `link` variant. */
  readonly linkedProviders?: readonly string[];
  readonly className?: string;
}

/**
 * Renders one OAuth challenge button per available external provider. The list
 * comes from the backend config via {@link useAvailableExternalProviders} — the
 * button label is the provider's `displayName`, the icon is keyed by its `type`,
 * and the scheme `name` is what travels to the challenge endpoint.
 *
 * Each button calls `POST /external-logins/challenge/{name}` through the
 * headless `useChallengeExternalLogin` hook. The SDK rethrows the framework's
 * error contract as an {@link HttpError}: `400` (provider not configured) or
 * `500` (configured but its auth handler is not registered on the host —
 * defence in depth, since the config list only advertises usable providers).
 * Those surface as scoped toasts here — the global mutation handler ignores them
 * because an `HttpError` is not an Axios error.
 *
 * ⚠️ SEAM. A live backend answers the challenge with a `302` to the identity
 * provider; the browser navigation is what actually starts the OAuth dance. With
 * MSW there is no IdP, so a successful challenge shows an informational toast
 * instead of navigating — replace the success branch with the real redirect once
 * the dev packages are published and `granit-showcase-dotnet` runs against them.
 */
export function ExternalLoginButtons({
  variant,
  linkedProviders = [],
  className,
}: ExternalLoginButtonsProps) {
  const { t } = useTranslation();
  const { providers } = useAvailableExternalProviders();
  const challenge = useChallengeExternalLogin();
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);

  const linked = new Set(linkedProviders.map((p) => p.toLowerCase()));
  const visible =
    variant === 'link' ? providers.filter((p) => !linked.has(p.name.toLowerCase())) : providers;

  if (visible.length === 0) return null;

  async function handleChallenge(provider: ExternalLoginProvider) {
    // `displayName` is the brand/custom label — not translated; only the
    // "Continue with …" gabarit is.
    const label = provider.displayName;
    setPendingProvider(provider.name);
    try {
      await challenge.mutateAsync(provider.name);
      toast.info(
        t('Auth.ExternalLogin.Redirecting', 'Redirecting to {{provider}}…', { provider: label })
      );
    } catch (err) {
      const unavailable = err instanceof HttpError && err.status === 500;
      const message = unavailable
        ? t('Auth.ExternalLogin.Unavailable', '{{provider}} sign-in is temporarily unavailable.', {
            provider: label,
          })
        : t('Auth.ExternalLogin.Failed', 'Could not start sign-in with {{provider}}.', {
            provider: label,
          });
      toast.error(message);
      logger.error('[ExternalLogin] Challenge failed', err);
    } finally {
      setPendingProvider(null);
    }
  }

  return (
    <div data-slot="external-login-buttons" className={className}>
      <div className="grid gap-2">
        {visible.map((provider) => {
          const label = provider.displayName;
          const text =
            variant === 'link'
              ? t('Auth.ExternalLogin.LinkWith', 'Link {{provider}}', { provider: label })
              : t('Auth.ExternalLogin.ContinueWith', 'Continue with {{provider}}', {
                  provider: label,
                });
          const isPending = pendingProvider === provider.name;
          return (
            <Button
              key={provider.name}
              type="button"
              variant="outline"
              className="w-full justify-center"
              disabled={challenge.isPending}
              aria-busy={isPending}
              onClick={() => handleChallenge(provider)}
            >
              <ExternalProviderIcon provider={provider.type} className="mr-2 h-4 w-4" />
              {text}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
