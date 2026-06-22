import { Badge, Tooltip, TooltipContent, TooltipTrigger } from '@granit/react-ui';

import type {
  PaymentMethodAmountBoundResponse,
  PaymentMethodCapabilityResponse,
  PaymentMethodSequenceTypeName,
} from '@granit/payments';

const SEQUENCE_LABELS: Readonly<Record<PaymentMethodSequenceTypeName, string>> = {
  oneoff: 'OneOff',
  first: 'First',
  recurring: 'Recurring',
};

const MAX_CHIPS = 3;

interface CapabilityBadgesProps {
  readonly capability: PaymentMethodCapabilityResponse;
}

/**
 * Compact capability summary: country chips, currency chips, sequence chips,
 * and an amount-bounds tooltip trigger. Empty sets render as "Global" or
 * "All currencies" — the backend treats an empty set on any axis as wildcard
 * and this is what operators expect to see.
 */
export function CapabilityBadges({ capability }: CapabilityBadgesProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" data-slot="capability-badges">
      <CountryBadges countries={capability.supportedCountries} />
      <CurrencyBadges currencies={capability.supportedCurrencies} />
      <SequenceBadges sequences={capability.supportedSequenceTypes} />
      <BoundsBadge bounds={capability.amountBounds} />
    </div>
  );
}

function CountryBadges({ countries }: { readonly countries: readonly string[] }) {
  if (countries.length === 0) {
    return (
      <Badge variant="secondary" aria-label="Supported worldwide">
        Global
      </Badge>
    );
  }
  const visible = countries.slice(0, MAX_CHIPS);
  const overflow = countries.length - visible.length;
  return (
    <>
      {visible.map((code) => (
        <Badge key={code} variant="outline" aria-label={`Supported in ${code}`}>
          {code}
        </Badge>
      ))}
      {overflow > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" aria-label={`${overflow} more countries`}>
              +{overflow}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{countries.slice(MAX_CHIPS).join(', ')}</TooltipContent>
        </Tooltip>
      )}
    </>
  );
}

function CurrencyBadges({ currencies }: { readonly currencies: readonly string[] }) {
  if (currencies.length === 0) {
    return (
      <Badge variant="secondary" aria-label="All currencies supported">
        All currencies
      </Badge>
    );
  }
  const visible = currencies.slice(0, MAX_CHIPS);
  const overflow = currencies.length - visible.length;
  return (
    <>
      {visible.map((code) => (
        <Badge key={code} variant="outline" aria-label={`Accepts ${code}`}>
          {code}
        </Badge>
      ))}
      {overflow > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" aria-label={`${overflow} more currencies`}>
              +{overflow}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{currencies.slice(MAX_CHIPS).join(', ')}</TooltipContent>
        </Tooltip>
      )}
    </>
  );
}

function SequenceBadges({
  sequences,
}: {
  readonly sequences: readonly PaymentMethodSequenceTypeName[];
}) {
  const resolved: readonly PaymentMethodSequenceTypeName[] =
    sequences.length === 0 ? ['oneoff', 'first', 'recurring'] : sequences;
  return (
    <>
      {resolved.map((seq) => (
        <Badge key={seq} variant="outline" aria-label={`${SEQUENCE_LABELS[seq]} sequence`}>
          {SEQUENCE_LABELS[seq]}
        </Badge>
      ))}
    </>
  );
}

function BoundsBadge({ bounds }: { readonly bounds: readonly PaymentMethodAmountBoundResponse[] }) {
  const [firstBound] = bounds;
  if (firstBound === undefined) {
    return (
      <Badge variant="secondary" aria-label="No amount limits">
        Unlimited
      </Badge>
    );
  }
  const label =
    bounds.length === 1 ? formatSingleBound(firstBound) : `${bounds.length} amount ranges`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" aria-label={label}>
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex flex-col gap-0.5 text-xs">
          {bounds.map((b) => (
            <span key={b.currencyCode}>{formatSingleBound(b)}</span>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/** Format a single amount bound into a human-readable string using `Intl.NumberFormat`. */
function formatSingleBound(bound: PaymentMethodAmountBoundResponse): string {
  const { currencyCode, minAmount, maxAmount } = bound;
  const fmt = currencyFormatter(currencyCode);
  if (minAmount === null && maxAmount === null) {
    return `${currencyCode} · any amount`;
  }
  if (minAmount !== null && maxAmount !== null) {
    return `${currencyCode} ${fmt.format(minAmount / 100)} – ${fmt.format(maxAmount / 100)}`;
  }
  if (minAmount !== null) {
    return `${currencyCode} ≥ ${fmt.format(minAmount / 100)}`;
  }
  return `${currencyCode} ≤ ${fmt.format(maxAmount! / 100)}`;
}

function currencyFormatter(currencyCode: string): Intl.NumberFormat {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    });
  } catch {
    // Fallback when an unknown currency slips through — never throws.
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
  }
}

/**
 * Small gray badge flagging an activation record that predates capability
 * snapshotting. UI should still let the admin interact with the method; a
 * Resync captures a snapshot.
 */
export function PendingSnapshotBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="secondary"
          className="bg-muted text-muted-foreground"
          aria-label="Capability snapshot pending"
        >
          Pending refresh
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        Activation predates provider capability snapshot. Click Resync to capture.
      </TooltipContent>
    </Tooltip>
  );
}
