import { Building2, CircleDollarSign, Landmark, Wallet } from 'lucide-react';

import { useOptionalPaymentsConfig } from '../providers/payments-provider';

import type { LucideIcon } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

export interface ProviderIconProps {
  /** Provider identifier (e.g., <c>stripe</c>, <c>mollie</c>, <c>sepa-transfer</c>). */
  readonly providerName: string;
  /** Icon container size in pixels. Default: 32. */
  readonly size?: number;
  /** Additional class names applied to the container. */
  readonly className?: string;
  /**
   * Override the generic icon with a custom node (e.g., a licensed brand SVG).
   * Takes precedence over any `brandIcons.provider` resolver on the surrounding
   * `PaymentsProvider`. Useful for apps that have obtained licenses from the
   * provider and want to display the official logo.
   */
  readonly customIcon?: ReactNode;
}

interface ProviderStyle {
  readonly icon: LucideIcon;
  readonly bg: string;
  readonly fg: string;
}

/**
 * Brand-adjacent colors + generic Lucide icon per provider.
 * Safe from a trademark standpoint — we do not reproduce protected brand logos.
 */
const PROVIDER_STYLES: Readonly<Record<string, ProviderStyle>> = {
  stripe: { icon: CircleDollarSign, bg: '#635BFF', fg: '#FFFFFF' },
  mollie: { icon: Wallet, bg: '#000000', fg: '#FFFFFF' },
  'sepa-transfer': { icon: Landmark, bg: '#16A34A', fg: '#FFFFFF' },
  'sepa-direct-debit': { icon: Landmark, bg: '#2563EB', fg: '#FFFFFF' },
  paypal: { icon: Wallet, bg: '#003087', fg: '#FFC439' },
  adyen: { icon: CircleDollarSign, bg: '#0ABF53', fg: '#FFFFFF' },
};

const FALLBACK: ProviderStyle = { icon: Building2, bg: '#64748B', fg: '#FFFFFF' };

/**
 * Renders a colored badge for a payment provider.
 *
 * @example
 * ```tsx
 * <ProviderIcon providerName="stripe" size={24} />
 * ```
 */
export function ProviderIcon({
  providerName,
  size = 32,
  className,
  customIcon,
}: ProviderIconProps) {
  const config = useOptionalPaymentsConfig();
  const baseContainerStyle: CSSProperties = { width: size, height: size };

  // Explicit prop wins; otherwise fall back to the app-supplied brand resolver.
  const brandIcon = customIcon ?? config?.brandIcons?.provider?.(providerName);

  if (brandIcon !== undefined) {
    return (
      <span
        className={`inline-flex items-center justify-center overflow-hidden rounded-md ${className ?? ''}`.trim()}
        style={baseContainerStyle}
        aria-label={providerName}
        data-provider-name={providerName}
      >
        {brandIcon}
      </span>
    );
  }

  const style = PROVIDER_STYLES[providerName.toLowerCase()] ?? FALLBACK;
  const Icon = style.icon;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md ${className ?? ''}`.trim()}
      style={{ ...baseContainerStyle, backgroundColor: style.bg, color: style.fg }}
      aria-label={providerName}
      data-provider-name={providerName}
    >
      <Icon size={Math.round(size * 0.55)} />
    </span>
  );
}
