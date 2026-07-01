import { useOptionalPaymentsConfig } from '@granit/react-payments';

import { resolveMethodIconStyle } from './method-icon-registry';

import type { CSSProperties, ReactNode } from 'react';

export interface PaymentMethodIconProps {
  /** Payment method identifier (e.g., <c>card</c>, <c>bancontact</c>). */
  readonly methodType: string;
  /** Category index (0-7) from the backend <c>PaymentMethodCategory</c> enum. */
  readonly category: number;
  /** Icon container size in pixels. Default: 32. */
  readonly size?: number;
  /** Additional class names applied to the container. */
  readonly className?: string;
  /** Optional label (title/aria-label) for the icon. */
  readonly title?: string;
  /**
   * Override the generic icon with a custom node (e.g., a licensed brand SVG).
   * When provided, the default colored badge is skipped and this node is rendered
   * inside the same sized container. Takes precedence over any `brandIcons.method`
   * resolver on the surrounding `PaymentsProvider`. Useful for apps that have
   * obtained brand licenses from payment providers (Bancontact, iDEAL, PayPal,
   * ...) and want to display the official logos.
   */
  readonly customIcon?: ReactNode;
}

/**
 * Renders a colored badge representing a payment method. Uses a generic
 * Lucide icon (selected by category) on a brand-adjacent background color
 * (derived from the method type). Safe from a trademark standpoint — we do
 * not reproduce protected brand logos.
 *
 * @example
 * ```tsx
 * <PaymentMethodIcon methodType="bancontact" category={1} size={32} />
 * ```
 */
export function PaymentMethodIcon({
  methodType,
  category,
  size = 32,
  className,
  title,
  customIcon,
}: PaymentMethodIconProps) {
  const config = useOptionalPaymentsConfig();
  const baseContainerStyle: CSSProperties = { width: size, height: size };

  // Explicit prop wins; otherwise fall back to the app-supplied brand resolver.
  const brandIcon = customIcon ?? config?.brandIcons?.method?.(methodType);

  if (brandIcon !== undefined) {
    return (
      <span
        className={`inline-flex items-center justify-center overflow-hidden rounded-md ${className ?? ''}`.trim()}
        style={baseContainerStyle}
        aria-label={title ?? methodType}
        title={title}
        data-method-type={methodType}
      >
        {brandIcon}
      </span>
    );
  }

  const style = resolveMethodIconStyle(methodType, category);
  const Icon = style.icon;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md ${className ?? ''}`.trim()}
      style={{ ...baseContainerStyle, backgroundColor: style.bg, color: style.fg }}
      aria-label={title ?? methodType}
      title={title}
      data-method-type={methodType}
    >
      <Icon size={Math.round(size * 0.55)} />
    </span>
  );
}
