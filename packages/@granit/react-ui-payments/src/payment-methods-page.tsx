import { useTranslation } from '@granit/react-localization';

import { PaymentConfigurationSection } from './components/payment-configuration-section';

/**
 * Host-level payment methods page: the platform operator activates or
 * deactivates which payment methods are available on the SaaS platform.
 *
 * Per-tenant flows (saving a card, attaching a SEPA mandate) live under the
 * tenant admin app, not here.
 *
 * The backend's configuration endpoint is a fused view — it already surfaces
 * every method each installed provider advertises, active or not, so the
 * admin sees new methods (e.g. a BNPL option Mollie just added) appear here
 * automatically, without waiting for a Granit release.
 */
export function PaymentMethodsPage() {
  const { t } = useTranslation();

  return (
    <div data-slot="payment-methods-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('Payments.Methods.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Payments.Methods.Subtitle')}</p>
      </div>

      <PaymentConfigurationSection />
    </div>
  );
}
