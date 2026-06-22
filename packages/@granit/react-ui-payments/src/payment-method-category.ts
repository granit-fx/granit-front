import type { PaymentMethodCategory } from '@granit/payments';

/**
 * Declaration order of the backend `PaymentMethodCategory` enum. The framework
 * `PaymentMethodIcon` takes the category as its numeric index (0-7), so this is
 * the single source of truth for that mapping — never inline the indices.
 */
const CATEGORY_ORDER: readonly PaymentMethodCategory[] = [
  'Card',
  'BankRedirect',
  'BankTransfer',
  'BankDebit',
  'Wallet',
  'BuyNowPayLater',
  'Voucher',
  'PointOfSale',
];

/** Index of a `PaymentMethodCategory` for `PaymentMethodIcon` (falls back to Card). */
export function categoryIndex(category: PaymentMethodCategory): number {
  const index = CATEGORY_ORDER.indexOf(category);
  return index >= 0 ? index : 0;
}

/**
 * Saved payment methods (`PaymentMethodResponse`) expose only a free-form `type`
 * string, not a `PaymentMethodCategory` (that field lives on the *available*
 * method DTOs). Map the common provider method types to a category so saved
 * methods can render with the shared `PaymentMethodIcon`; unknown types fall
 * back to `Card`.
 */
const METHOD_TYPE_CATEGORY: Readonly<Record<string, PaymentMethodCategory>> = {
  card: 'Card',
  bancontact: 'BankRedirect',
  ideal: 'BankRedirect',
  sofort: 'BankRedirect',
  giropay: 'BankRedirect',
  eps: 'BankRedirect',
  p24: 'BankRedirect',
  bank_transfer: 'BankTransfer',
  sepa_credit_transfer: 'BankTransfer',
  sepa_debit: 'BankDebit',
  ach_debit: 'BankDebit',
  bacs_debit: 'BankDebit',
  paypal: 'Wallet',
  apple_pay: 'Wallet',
  google_pay: 'Wallet',
  alipay: 'Wallet',
  wechat_pay: 'Wallet',
  klarna: 'BuyNowPayLater',
  affirm: 'BuyNowPayLater',
  afterpay_clearpay: 'BuyNowPayLater',
  voucher: 'Voucher',
  multibanco: 'Voucher',
  boleto: 'Voucher',
  oxxo: 'Voucher',
};

/** Best-effort category for a saved method's free-form `type` string. */
export function methodTypeCategory(methodType: string): PaymentMethodCategory {
  return METHOD_TYPE_CATEGORY[methodType.toLowerCase()] ?? 'Card';
}

/** Convenience: `PaymentMethodIcon` category index for a saved method `type`. */
export function methodTypeCategoryIndex(methodType: string): number {
  return categoryIndex(methodTypeCategory(methodType));
}
