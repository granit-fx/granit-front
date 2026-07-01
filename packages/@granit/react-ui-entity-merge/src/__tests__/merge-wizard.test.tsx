import { mockMergeResult } from '@granit/react-entity-merge/testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MergeWizard } from '../components/merge-wizard';
import { entityMergeTranslationsEn } from '../locales/en';

import { createEntityMergeHarness } from './test-utils';

import type { AxiosInstance } from '@granit/api-client';

afterEach(() => vi.restoreAllMocks());

function renderWizard(
  client: AxiosInstance,
  props: Partial<React.ComponentProps<typeof MergeWizard>> = {}
) {
  const { wrapper } = createEntityMergeHarness(client);
  return render(
    <MergeWizard
      survivorId="s1"
      loserId="l1"
      labels={entityMergeTranslationsEn}
      onSuccess={props.onSuccess}
      onCancel={props.onCancel}
    />,
    { wrapper }
  );
}

describe('MergeWizard (generic)', () => {
  it('previews, resolves a conflict, confirms and commits', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(mockMergeResult));
    vi.mocked(client.post).mockResolvedValue(axiosResponse({ ...mockMergeResult, dryRun: false }));
    const onSuccess = vi.fn();
    renderWizard(client, { onSuccess });

    await waitFor(() => expect(screen.getAllByRole('radiogroup')).toHaveLength(2));

    // Non-zero rewrite counts surface; zero-count ones do not.
    expect(screen.getByText('Invoice.PartyId')).toBeInTheDocument();
    expect(screen.queryByText('Payment.PartyId')).not.toBeInTheDocument();

    // Flip Name → Loser.
    const nameLoser = within(screen.getByRole('radiogroup', { name: 'Name' })).getAllByRole(
      'radio'
    )[1]!;
    fireEvent.click(nameLoser);

    // Open the confirm step, then confirm.
    fireEvent.click(screen.getByRole('button', { name: entityMergeTranslationsEn.merge }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('button', { name: entityMergeTranslationsEn.confirmDialog.confirm })
    );

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    const [, body] = vi.mocked(client.post).mock.calls[0]!;
    expect(body).toMatchObject({
      loserId: 'l1',
      dryRun: false,
      reason: null,
      choices: { Name: 'Loser', TaxStatus: 'Loser' },
    });
  });

  it('shows the domain message + detail on a 422', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(mockMergeResult));
    vi.mocked(client.post).mockRejectedValue({
      response: { status: 422, data: { detail: 'Currency mismatch.' } },
    });
    renderWizard(client);

    await waitFor(() => expect(screen.getAllByRole('radiogroup')).toHaveLength(2));
    fireEvent.click(screen.getByRole('button', { name: entityMergeTranslationsEn.merge }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: entityMergeTranslationsEn.confirmDialog.confirm,
      })
    );

    const alert = await screen.findByRole('alert');
    expect(alert.textContent ?? '').toMatch(/Currency mismatch\./);
  });

  it('renders the preview-error state and disables the merge button', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('preview boom'));
    renderWizard(client);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe(entityMergeTranslationsEn.conflictTable.error);
    expect(
      (screen.getByRole('button', { name: entityMergeTranslationsEn.merge }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
  });

  it('calls onCancel from the Cancel button', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(mockMergeResult));
    const onCancel = vi.fn();
    renderWizard(client, { onCancel });

    await waitFor(() => expect(screen.getAllByRole('radiogroup')).toHaveLength(2));
    fireEvent.click(screen.getByRole('button', { name: entityMergeTranslationsEn.cancel }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
