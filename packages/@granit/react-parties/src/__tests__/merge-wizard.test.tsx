import { createTestQueryClient } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import i18next from 'i18next';
import * as React from 'react';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { MergeWizard } from '../components/merge-wizard';
import { partiesTranslationsEn } from '../locales/en';
import { PartiesProvider } from '../providers/parties-provider';

import type { PartiesConfig } from '../providers/parties-provider';
import type { PartyEmailId, PartyId, PartyMergeResponse, PartyResponse } from '@granit/parties';
import type { AxiosError, AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const survivorId: PartyId = toEntityId<'Party'>('00000000-0000-0000-0000-000000000001');
const loserId: PartyId = toEntityId<'Party'>('00000000-0000-0000-0000-000000000002');

const survivor: PartyResponse = makeParty(survivorId, {
  name: 'Acme S',
  emailAddress: 'billing@acme-s.example',
});

const loser: PartyResponse = makeParty(loserId, {
  name: 'Acme L',
  emailAddress: 'billing@acme-l.example',
  taxStatus: { isExempt: true, reverseCharge: false, vatin: null, evidenceBlobId: null },
});

const previewResponse: PartyMergeResponse = {
  survivorId,
  loserId,
  conflicts: [
    { fieldPath: 'Name', survivorValue: 'Acme S', loserValue: 'Acme L', default: 'Survivor' },
    {
      fieldPath: 'TaxStatus',
      survivorValue: 'Standard',
      loserValue: 'Exempt',
      default: 'Loser',
    },
  ],
  rewriteCounts: { 'Invoice.PartyId': 17, 'Subscription.PartyId': 3, 'Payment.PartyId': 0 },
  dryRun: true,
};

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      lng: 'en',
      fallbackLng: 'en',
      ns: ['parties'],
      defaultNS: 'parties',
      resources: { en: { parties: partiesTranslationsEn } },
      interpolation: { escapeValue: false },
      returnNull: false,
    });
  }
});

afterEach(() => vi.restoreAllMocks());

function renderWizard(
  client: AxiosInstance,
  props: Partial<React.ComponentProps<typeof MergeWizard>> = {}
) {
  const queryClient = createTestQueryClient();
  const config: PartiesConfig = { client };
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18next}>
        <QueryClientProvider client={queryClient}>
          <PartiesProvider config={config}>{children}</PartiesProvider>
        </QueryClientProvider>
      </I18nextProvider>
    );
  }
  return render(
    <MergeWizard
      survivorId={survivorId}
      loserId={loserId}
      onCancel={props.onCancel}
      onSuccess={props.onSuccess}
    />,
    { wrapper: Wrapper }
  );
}

function stubReads(client: AxiosInstance, options: { previewResponse?: PartyMergeResponse } = {}) {
  vi.mocked(client.get).mockImplementation((url: string) => {
    if (url.endsWith(`/parties/${survivorId}`)) return Promise.resolve(axiosResponse(survivor));
    if (url.endsWith(`/parties/${loserId}`)) return Promise.resolve(axiosResponse(loser));
    if (url.endsWith(`/parties/${survivorId}/merge/preview`)) {
      return Promise.resolve(axiosResponse(options.previewResponse ?? previewResponse));
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`));
  });
}

describe('MergeWizard', () => {
  it('renders survivor + loser cards once the parties + preview are loaded', async () => {
    const client = createMockClient();
    stubReads(client);
    const { container } = renderWizard(client);

    const survivorCard = container.querySelector('[data-variant="survivor"]') as HTMLElement;
    const loserCard = container.querySelector('[data-variant="loser"]') as HTMLElement;
    expect(survivorCard).not.toBeNull();
    expect(loserCard).not.toBeNull();

    await waitFor(() => expect(within(survivorCard).queryByText('Acme S')).not.toBeNull());
    expect(within(loserCard).queryByText('Acme L')).not.toBeNull();
    expect(within(survivorCard).queryByText('Active')).not.toBeNull();
    expect(within(loserCard).queryByText('Active')).not.toBeNull();
  });

  it('renders one conflict row per FieldConflict with the default winner pre-checked', async () => {
    const client = createMockClient();
    stubReads(client);
    renderWizard(client);

    await waitFor(() =>
      expect(screen.getAllByRole('radiogroup').length).toBe(previewResponse.conflicts.length)
    );

    // Name conflict — default is "Survivor"
    const nameGroup = screen.getByRole('radiogroup', { name: /Name/ });
    const nameRadios = within(nameGroup).getAllByRole('radio') as HTMLInputElement[];
    expect(nameRadios[0]!.checked).toBe(true);
    expect(nameRadios[1]!.checked).toBe(false);

    // TaxStatus conflict — default is "Loser"
    const taxGroup = screen.getByRole('radiogroup', { name: /Tax status/ });
    const taxRadios = within(taxGroup).getAllByRole('radio') as HTMLInputElement[];
    expect(taxRadios[0]!.checked).toBe(false);
    expect(taxRadios[1]!.checked).toBe(true);
  });

  it('lists only non-zero rewrite counts', async () => {
    const client = createMockClient();
    stubReads(client);
    renderWizard(client);

    await waitFor(() => expect(screen.queryByText('Invoices')).not.toBeNull());
    expect(screen.queryByText('Subscriptions')).not.toBeNull();
    // Payment.PartyId has count 0 — should NOT render
    expect(screen.queryByText('Payments')).toBeNull();
  });

  it('switching a radio mutates the choices sent on submit', async () => {
    const client = createMockClient();
    stubReads(client);
    vi.mocked(client.post).mockResolvedValue(axiosResponse({ ...previewResponse, dryRun: false }));
    const onSuccess = vi.fn();
    renderWizard(client, { onSuccess });

    await waitFor(() => expect(screen.getAllByRole('radiogroup').length).toBe(2));

    // Flip Name to "Loser"
    const nameGroup = screen.getByRole('radiogroup', { name: /Name/ });
    const nameLoserRadio = within(nameGroup).getAllByRole('radio')[1]!;
    fireEvent.click(nameLoserRadio);

    // Set a reason
    const reasonField = screen.getByLabelText(partiesTranslationsEn.MergeWizard.Reason);
    fireEvent.change(reasonField, { target: { value: 'Duplicate from ERP sync' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: partiesTranslationsEn.MergeWizard.Merge }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ survivorId, loserId }));

    const [, body, options] = vi.mocked(client.post).mock.calls[0]!;
    expect(body).toMatchObject({
      loserId,
      reason: 'Duplicate from ERP sync',
      dryRun: false,
      choices: { Name: 'Loser', TaxStatus: 'Loser' },
    });
    expect(options).toMatchObject({
      headers: { 'Idempotency-Key': expect.stringMatching(/^[0-9a-f-]{36}$/i) },
    });
  });

  it('displays the domain message on a 422 conflict', async () => {
    const client = createMockClient();
    stubReads(client);
    const error: Partial<AxiosError> = {
      isAxiosError: true,
      response: {
        status: 422,
        data: { detail: 'Currency mismatch between survivor and loser.' },
        statusText: '',
        headers: {},
        config: {} as never,
      },
    };
    vi.mocked(client.post).mockRejectedValue(error);
    renderWizard(client);

    const submitButton = screen.getByRole('button', {
      name: partiesTranslationsEn.MergeWizard.Merge,
    }) as HTMLButtonElement;
    await waitFor(() => expect(submitButton.disabled).toBe(false));

    fireEvent.click(submitButton);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent ?? '').toMatch(/Currency mismatch between survivor and loser/);
  });

  it('displays the AlreadyMerged warning on a 409 conflict', async () => {
    const client = createMockClient();
    stubReads(client);
    const error: Partial<AxiosError> = {
      isAxiosError: true,
      response: {
        status: 409,
        data: { detail: 'Already merged.' },
        statusText: '',
        headers: {},
        config: {} as never,
      },
    };
    vi.mocked(client.post).mockRejectedValue(error);
    renderWizard(client);

    const submitButton = screen.getByRole('button', {
      name: partiesTranslationsEn.MergeWizard.Merge,
    }) as HTMLButtonElement;
    await waitFor(() => expect(submitButton.disabled).toBe(false));

    fireEvent.click(submitButton);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe(partiesTranslationsEn.MergeWizard.Errors.AlreadyMerged);
  });

  it('renders the preview-error state when the preview request fails', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockImplementation((url: string) => {
      if (url.endsWith(`/parties/${survivorId}`)) return Promise.resolve(axiosResponse(survivor));
      if (url.endsWith(`/parties/${loserId}`)) return Promise.resolve(axiosResponse(loser));
      return Promise.reject(new Error('preview boom'));
    });
    renderWizard(client);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe(partiesTranslationsEn.MergeWizard.Errors.PreviewFailed);

    const submitButton = screen.getByRole('button', {
      name: partiesTranslationsEn.MergeWizard.Merge,
    }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
  });

  it('renders the empty-conflicts message when the preview returns no conflicts', async () => {
    const client = createMockClient();
    stubReads(client, {
      previewResponse: { ...previewResponse, conflicts: [], rewriteCounts: {} },
    });
    renderWizard(client);

    await waitFor(() =>
      expect(screen.queryByText(partiesTranslationsEn.MergeWizard.ConflictsEmpty)).not.toBeNull()
    );
    expect(screen.queryByText(partiesTranslationsEn.MergeWizard.RewritesEmpty)).not.toBeNull();
  });

  it('falls back to the unknown-error label on a non-axios mutation failure', async () => {
    const client = createMockClient();
    stubReads(client);
    vi.mocked(client.post).mockRejectedValue(new Error('network down'));
    renderWizard(client);

    const submitButton = screen.getByRole('button', {
      name: partiesTranslationsEn.MergeWizard.Merge,
    }) as HTMLButtonElement;
    await waitFor(() => expect(submitButton.disabled).toBe(false));

    fireEvent.click(submitButton);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe(partiesTranslationsEn.MergeWizard.Errors.Unknown);
  });

  it('surfaces the response detail directly when the status is neither 409 nor 422', async () => {
    const client = createMockClient();
    stubReads(client);
    const error: Partial<AxiosError> = {
      isAxiosError: true,
      response: {
        status: 500,
        data: { title: 'Internal Server Error' },
        statusText: '',
        headers: {},
        config: {} as never,
      },
    };
    vi.mocked(client.post).mockRejectedValue(error);
    renderWizard(client);

    const submitButton = screen.getByRole('button', {
      name: partiesTranslationsEn.MergeWizard.Merge,
    }) as HTMLButtonElement;
    await waitFor(() => expect(submitButton.disabled).toBe(false));

    fireEvent.click(submitButton);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Internal Server Error');
  });

  it('calls onCancel when the Cancel button is clicked', async () => {
    const client = createMockClient();
    stubReads(client);
    const onCancel = vi.fn();
    renderWizard(client, { onCancel });

    const cancelButton = screen.getByRole('button', {
      name: partiesTranslationsEn.MergeWizard.Cancel,
    }) as HTMLButtonElement;
    await waitFor(() => expect(cancelButton.disabled).toBe(false));

    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

// ── Test helpers ───────────────────────────────────────────────────────────

function makeParty(
  id: PartyId,
  override: { name: string; emailAddress?: string; taxStatus?: PartyResponse['taxStatus'] }
): PartyResponse {
  const emails: PartyResponse['emails'] = override.emailAddress
    ? [
        {
          id: toEntityId<'PartyEmail'>(`email-${id}`) as PartyEmailId,
          address: override.emailAddress,
          isPrimary: true,
          label: null,
        },
      ]
    : [];

  return {
    id,
    tenantId: null,
    kind: 'Company',
    name: override.name,
    defaultCurrency: 'EUR',
    timezone: 'UTC',
    language: null,
    website: null,
    taxId: null,
    registrationNumber: null,
    parentPartyId: null,
    userId: null,
    avatar: null,
    roles: 'Customer',
    status: 'Active',
    addresses: [],
    emails,
    phones: [],
    externalMappings: [],
    taxStatus: override.taxStatus ?? {
      isExempt: false,
      reverseCharge: false,
      vatin: null,
      evidenceBlobId: null,
    },
    metadata: {},
    internalNotes: null,
    createdAt: toISODateString('2026-01-01T00:00:00Z'),
    modifiedAt: null,
  };
}
