import {
  PaymentMethodIcon,
  ProviderIcon,
  useActivatePaymentMethod,
  useDeactivatePaymentMethod,
  usePaymentMethodConfigurations,
  useProviderCatalog,
  useResyncPaymentMethod,
} from '@granit/react-payments';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  toast,
} from '@granit/react-ui';
import { RefreshCw } from 'lucide-react';

import { categoryIndex } from '../payment-method-category';

import { CapabilityBadges, PendingSnapshotBadge } from './capability-badges';

import type {
  PaymentCatalogMethod,
  PaymentMethodCapabilityResponse,
  PaymentMethodCategory,
} from '@granit/payments';

const CATEGORY_LABELS: Record<PaymentMethodCategory, string> = {
  Card: 'Card',
  BankRedirect: 'Bank Redirect',
  BankTransfer: 'Bank Transfer',
  BankDebit: 'Bank Debit',
  Wallet: 'Wallet',
  BuyNowPayLater: 'Buy Now Pay Later',
  Voucher: 'Voucher',
  PointOfSale: 'Point of Sale',
};

/**
 * Host-level payment configuration panel. One card per installed provider,
 * each row carrying the full capability badges (countries / currencies /
 * sequences / bounds) regardless of activation state — the data comes from
 * the live provider catalog, not the DB snapshot, so inactive methods also
 * surface what they would offer once activated.
 */
export function PaymentConfigurationSection() {
  const configsQuery = usePaymentMethodConfigurations();
  const providers = configsQuery.data ?? [];

  return (
    <div className="space-y-3" data-slot="payment-configuration-section">
      {configsQuery.isLoading && (
        <div className="flex h-32 items-center justify-center">
          <Spinner />
        </div>
      )}
      {!configsQuery.isLoading && providers.length > 0 && (
        <div className="space-y-4">
          {providers.map((provider) => (
            <ProviderConfigurationCard
              key={provider.providerName}
              providerName={provider.providerName}
            />
          ))}
        </div>
      )}
      {!configsQuery.isLoading && providers.length === 0 && (
        <p className="py-4 text-sm text-muted-foreground">
          No payment providers installed. Install a provider package (Stripe, SEPA, ...) to see
          methods here.
        </p>
      )}
    </div>
  );
}

/**
 * Per-provider card driven by the live catalog endpoint. Split out from the
 * parent so each provider gets its own `useProviderCatalog` query — React
 * forbids hooks in a loop, and co-locating the query here keeps invalidation
 * granular (one stale provider doesn't refetch the rest).
 */
function ProviderConfigurationCard({ providerName }: { readonly providerName: string }) {
  const catalogQuery = useProviderCatalog(providerName);
  const activate = useActivatePaymentMethod();
  const deactivate = useDeactivatePaymentMethod();
  const resync = useResyncPaymentMethod();

  const methods = catalogQuery.data?.methods ?? [];
  const activeCount = methods.filter((m) => m.activated).length;

  function handleToggle(method: PaymentCatalogMethod) {
    // API errors are surfaced by the global MutationCache.onError toast.
    if (method.activated) {
      deactivate.mutate(
        { providerName, methodType: method.methodType },
        { onSuccess: () => toast.success(`${method.displayLabel} deactivated`) }
      );
    } else {
      activate.mutate(
        { providerName, methodType: method.methodType },
        { onSuccess: () => toast.success(`${method.displayLabel} activated`) }
      );
    }
  }

  function handleResync(method: PaymentCatalogMethod) {
    // API errors are surfaced by the global MutationCache.onError toast.
    resync.mutate(
      { providerName, methodType: method.methodType },
      {
        onSuccess: (updated) =>
          toast.success(
            describeResyncDiff(method.displayLabel, method.capability, updated.capabilitySnapshot)
          ),
      }
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ProviderIcon providerName={providerName} size={28} />
            <CardTitle className="text-base font-semibold capitalize">{providerName}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {!catalogQuery.isLoading && (
              <Badge variant="outline">
                {activeCount} / {methods.length} active
              </Badge>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={catalogQuery.isFetching}
                  onClick={() => catalogQuery.refetch()}
                  aria-label={`Refresh ${providerName} catalog`}
                  data-slot="provider-refresh-button"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${catalogQuery.isFetching ? 'animate-spin' : ''}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Re-fetch the live catalog from {providerName}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {catalogQuery.isLoading && (
          <div className="flex h-20 items-center justify-center">
            <Spinner />
          </div>
        )}
        {!catalogQuery.isLoading && catalogQuery.isError && (
          <p className="py-2 text-sm text-destructive">
            Failed to load {providerName} catalog: {(catalogQuery.error as Error).message}
          </p>
        )}
        {!catalogQuery.isLoading && !catalogQuery.isError && methods.length === 0 && (
          <p className="py-2 text-sm text-muted-foreground">
            {providerName} does not currently advertise any methods.
          </p>
        )}
        {!catalogQuery.isLoading &&
          !catalogQuery.isError &&
          methods.length > 0 &&
          methods.map((method) => (
            <div
              key={method.methodType}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-2 last:border-0"
              data-slot="configuration-row"
              data-method-type={method.methodType}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <PaymentMethodIcon
                  methodType={method.methodType}
                  category={categoryIndex(method.category)}
                  size={32}
                  title={method.displayLabel}
                />
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-foreground">{method.displayLabel}</span>
                  <span className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[method.category]} · {method.methodType}
                  </span>
                </div>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <CapabilityBadges capability={method.capability} />
                {method.activated && !method.hasSnapshot && <PendingSnapshotBadge />}
              </div>
              <div className="flex items-center gap-2">
                {method.activated && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={resync.isPending}
                        onClick={() => handleResync(method)}
                        aria-label={`Resync ${method.displayLabel}`}
                        data-slot="resync-button"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Resync capability from provider</TooltipContent>
                  </Tooltip>
                )}
                <Switch
                  checked={method.activated}
                  disabled={activate.isPending || deactivate.isPending}
                  onCheckedChange={() => handleToggle(method)}
                />
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}

/**
 * Build a toast message highlighting which axes of the capability changed
 * between the catalog-live snapshot and the freshly resynced DB snapshot.
 * Keeps ops aware when a provider silently widens or narrows coverage.
 */
function describeResyncDiff(
  label: string,
  previous: PaymentMethodCapabilityResponse,
  next: PaymentMethodCapabilityResponse | null
): string {
  if (!next) {
    return `${label} resynced`;
  }

  const changes: string[] = [];
  if (!arraysEqual(previous.supportedCountries, next.supportedCountries)) changes.push('countries');
  if (!arraysEqual(previous.supportedCurrencies, next.supportedCurrencies))
    changes.push('currencies');
  if (!arraysEqual(previous.supportedSequenceTypes, next.supportedSequenceTypes))
    changes.push('sequences');
  if (!boundsEqual(previous.amountBounds, next.amountBounds)) changes.push('bounds');

  if (changes.length === 0) return `${label} · no changes`;
  return `${label} · updated ${changes.join(', ')}`;
}

function arraysEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function boundsEqual(
  a: readonly { currencyCode: string; minAmount: number | null; maxAmount: number | null }[],
  b: readonly { currencyCode: string; minAmount: number | null; maxAmount: number | null }[]
): boolean {
  if (a.length !== b.length) return false;
  const byCurrency = new Map(a.map((x) => [x.currencyCode, x]));
  return b.every((y) => {
    const x = byCurrency.get(y.currencyCode);
    return x?.minAmount === y.minAmount && x?.maxAmount === y.maxAmount;
  });
}
