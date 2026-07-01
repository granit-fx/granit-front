import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createTransactionColumns } from '../components/transaction-columns';

import type { BalanceTransactionResponse } from '@granit/customer-balance';
import type { CellContext } from '@tanstack/react-table';
import type { ReactNode } from 'react';

// The wire contract (contracts/openapi/customer-balance.json) types both
// `AdminCreditRequest.amount` and `BalanceTransactionResponse.amount` as
// `format: double` decimals — i.e. MAJOR currency units, not integer minor
// units/cents (backend `decimal Amount`, no ×100 conversion). The add-credit
// dialog POSTs the raw major-unit value, so the read column must render that
// same value verbatim — no `/ 100`. This guards the money round-trip.
describe('createTransactionColumns amount cell', () => {
  const columns = createTransactionColumns({
    t: ((key: string) => key) as never,
    formatDateTime: (d) => String(d),
    locale: 'en-US',
  });
  const amountColumn = columns.find((c) => c.id === 'amount');

  function renderAmount(row: Partial<BalanceTransactionResponse>): string {
    const cellFn = amountColumn?.cell as (
      ctx: CellContext<BalanceTransactionResponse, unknown>
    ) => ReactNode;
    const { container } = render(<>{cellFn({ row: { original: row } } as never)}</>);
    return container.textContent ?? '';
  }

  it('should render the credit amount in major units without dividing by 100', () => {
    expect(renderAmount({ amount: 12.5, type: 'Credit' })).toBe('+12.50');
  });

  it('should render the debit amount in major units without dividing by 100', () => {
    expect(renderAmount({ amount: 100, type: 'Debit' })).toBe('100.00');
  });

  it('should preserve the exact wire value posted by the add-credit dialog', () => {
    // A dialog POST of `amount: 42.99` (major units) must read back as 42.99.
    const posted = 42.99;
    expect(renderAmount({ amount: posted, type: 'Credit' })).toBe(`+${posted.toFixed(2)}`);
  });
});
