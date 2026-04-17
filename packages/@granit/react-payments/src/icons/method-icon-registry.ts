import {
  ArrowRightLeft,
  Banknote,
  Calendar,
  CreditCard,
  Landmark,
  Store,
  Ticket,
  Wallet,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

/**
 * Registry of visual styles per payment method type.
 *
 * Provides a generic Lucide icon (picked by category) paired with a
 * brand-adjacent color, so the admin UI can show visually distinct badges
 * for each method without reproducing protected brand logos.
 */
export interface MethodIconStyle {
  readonly icon: LucideIcon;
  /** Background color for the badge. */
  readonly bg: string;
  /** Foreground (icon + text) color. */
  readonly fg: string;
}

const CARD: MethodIconStyle = { icon: CreditCard, bg: '#4F46E5', fg: '#FFFFFF' };
const WALLET: MethodIconStyle = { icon: Wallet, bg: '#0F172A', fg: '#FFFFFF' };
const BANK_REDIRECT: MethodIconStyle = { icon: Landmark, bg: '#475569', fg: '#FFFFFF' };
const BANK_TRANSFER: MethodIconStyle = { icon: ArrowRightLeft, bg: '#16A34A', fg: '#FFFFFF' };
const BANK_DEBIT: MethodIconStyle = { icon: Banknote, bg: '#2563EB', fg: '#FFFFFF' };
const BNPL: MethodIconStyle = { icon: Calendar, bg: '#DB2777', fg: '#FFFFFF' };
const VOUCHER: MethodIconStyle = { icon: Ticket, bg: '#CA8A04', fg: '#FFFFFF' };
const POS: MethodIconStyle = { icon: Store, bg: '#7C3AED', fg: '#FFFFFF' };

/**
 * Method-specific overrides — keep the category icon but use brand-adjacent
 * colors so each method is visually distinct in the admin UI.
 */
const METHOD_COLORS: Readonly<Record<string, Pick<MethodIconStyle, 'bg' | 'fg'>>> = {
  card: { bg: '#4F46E5', fg: '#FFFFFF' },
  bancontact: { bg: '#1E5BAA', fg: '#FFD700' },
  ideal: { bg: '#CC0066', fg: '#FFFFFF' },
  eps: { bg: '#B91C1C', fg: '#FFFFFF' },
  giropay: { bg: '#003A80', fg: '#FFFFFF' },
  przelewy24: { bg: '#D13239', fg: '#FFFFFF' },
  blik: { bg: '#F97316', fg: '#FFFFFF' },
  twint: { bg: '#000000', fg: '#F97316' },
  trustly: { bg: '#0EE06E', fg: '#0F172A' },
  mybank: { bg: '#1E40AF', fg: '#FFFFFF' },
  belfius: { bg: '#E60028', fg: '#FFFFFF' },
  kbc: { bg: '#0076BA', fg: '#FFFFFF' },
  bank_transfer: { bg: '#16A34A', fg: '#FFFFFF' },
  sepa_debit: { bg: '#002D74', fg: '#FFFFFF' },
  apple_pay: { bg: '#000000', fg: '#FFFFFF' },
  google_pay: { bg: '#0F172A', fg: '#FFFFFF' },
  paypal: { bg: '#003087', fg: '#FFC439' },
  alipay: { bg: '#1677FF', fg: '#FFFFFF' },
  wechat_pay: { bg: '#07C160', fg: '#FFFFFF' },
  klarna: { bg: '#FFA8CD', fg: '#17120F' },
  alma: { bg: '#FA5022', fg: '#FFFFFF' },
  riverty: { bg: '#00D639', fg: '#0F172A' },
  paysafecard: { bg: '#00377B', fg: '#FFFFFF' },
};

/**
 * Maps a backend <c>PaymentMethodCategory</c> enum index to a base style.
 * Order must match <c>Granit.Payments.Domain.PaymentMethodCategory</c>.
 */
const CATEGORY_STYLES: readonly MethodIconStyle[] = [
  CARD, // 0
  BANK_REDIRECT, // 1
  BANK_TRANSFER, // 2
  BANK_DEBIT, // 3
  WALLET, // 4
  BNPL, // 5
  VOUCHER, // 6
  POS, // 7
];

/**
 * Resolves the icon style for a given payment method.
 *
 * @param methodType - Stable identifier (e.g., <c>card</c>, <c>bancontact</c>).
 * @param category - Backend category index (0-7).
 */
export function resolveMethodIconStyle(
  methodType: string,
  category: number,
): MethodIconStyle {
  const base = CATEGORY_STYLES[category] ?? CARD;
  const override = METHOD_COLORS[methodType];
  if (!override) {
    return base;
  }
  return { icon: base.icon, bg: override.bg, fg: override.fg };
}
