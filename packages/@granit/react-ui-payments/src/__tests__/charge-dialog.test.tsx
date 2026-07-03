import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChargeDialog } from '../components/charge-dialog';

import { renderWithProviders } from './test-utils';

import type * as ReactPaymentsModule from '@granit/react-payments';

const mutate = vi.fn();

vi.mock('@granit/react-payments', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactPaymentsModule>();
  return {
    ...actual,
    useInitiatePaymentCharge: () => ({ mutate, isPending: false }),
  };
});

const UUID_A = '00000000-0000-0000-0000-000000000001';
const UUID_B = '00000000-0000-0000-0000-000000000002';

describe('ChargeDialog', () => {
  it('collects partyId and submits it on the charge request', async () => {
    mutate.mockClear();
    const { user } = renderWithProviders(<ChargeDialog open onOpenChange={() => undefined} />);

    await user.type(screen.getByLabelText('Invoice ID'), UUID_A);
    await user.type(screen.getByLabelText('Party ID'), UUID_B);
    await user.clear(screen.getByLabelText('Amount'));
    await user.type(screen.getByLabelText('Amount'), '5000');
    await user.type(screen.getByLabelText('Method Type'), 'Card');
    await user.click(screen.getByRole('button', { name: 'Charge' }));

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toMatchObject({
      invoiceId: UUID_A,
      partyId: UUID_B,
      currency: 'EUR',
      methodType: 'Card',
    });
  });
});
