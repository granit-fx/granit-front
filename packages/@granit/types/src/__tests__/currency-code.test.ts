import { describe, expectTypeOf, it } from 'vitest';

import type { CurrencyCode } from '../currency-code';

describe('CurrencyCode', () => {
  it('accepts valid currency codes', () => {
    const eur: CurrencyCode = 'EUR';
    const usd: CurrencyCode = 'USD';
    const gbp: CurrencyCode = 'GBP';

    expectTypeOf(eur).toMatchTypeOf<CurrencyCode>();
    expectTypeOf(usd).toMatchTypeOf<CurrencyCode>();
    expectTypeOf(gbp).toMatchTypeOf<CurrencyCode>();
  });

  it('is a union of string literals', () => {
    expectTypeOf<CurrencyCode>().toMatchTypeOf<string>();
  });
});
