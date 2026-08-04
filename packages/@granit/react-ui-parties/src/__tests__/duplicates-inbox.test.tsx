import { PartiesProvider, partiesTranslationsEn } from '@granit/react-parties';
import { createTestQueryClient } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import i18next from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { DuplicatesInbox } from '../components/duplicates-inbox';

import type {
  PartyDuplicateCandidateId,
  PartyDuplicateCandidateResponse,
  PartyId,
} from '@granit/parties';
import type { PartiesConfig } from '@granit/react-parties';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const partyA: PartyId = toEntityId<'Party'>('00000000-0000-0000-0000-000000000001');
const partyB: PartyId = toEntityId<'Party'>('00000000-0000-0000-0000-000000000002');
const partyC: PartyId = toEntityId<'Party'>('00000000-0000-0000-0000-000000000003');
const dupId1: PartyDuplicateCandidateId = toEntityId<'PartyDuplicateCandidate'>('dup-001');
const dupId2: PartyDuplicateCandidateId = toEntityId<'PartyDuplicateCandidate'>('dup-002');

const rows: PartyDuplicateCandidateResponse[] = [
  {
    id: dupId1,
    partyId: partyA,
    candidateId: partyB,
    score: 0.97,
    tier: 'Deterministic',
    signals: [],
    dismissedAt: null,
    createdAt: toISODateString('2026-04-25T08:00:00Z'),
    updatedAt: toISODateString('2026-04-26T02:00:00Z'),
  },
  {
    id: dupId2,
    partyId: partyB,
    candidateId: partyC,
    score: 0.62,
    tier: 'Fuzzy',
    signals: [],
    dismissedAt: null,
    createdAt: toISODateString('2026-04-26T14:00:00Z'),
    updatedAt: null,
  },
];

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

function renderInbox(
  client: AxiosInstance,
  options?: {
    onMerge?: (row: PartyDuplicateCandidateResponse) => void;
    pageSize?: number;
    partyDetailBasePath?: string;
  }
) {
  const queryClient = createTestQueryClient();
  const config: PartiesConfig = { client };
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18next}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <PartiesProvider config={config}>{children}</PartiesProvider>
          </MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>
    );
  }
  return render(
    <DuplicatesInbox
      onMerge={options?.onMerge}
      pageSize={options?.pageSize}
      partyDetailBasePath={options?.partyDetailBasePath}
    />,
    { wrapper: Wrapper }
  );
}

describe('DuplicatesInbox', () => {
  it('renders one tier badge per candidate after the QueryEngine call resolves', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ items: rows, totalCount: rows.length })
    );

    const { container } = renderInbox(client);

    await waitFor(() =>
      expect(container.querySelectorAll('[data-slot="tier-badge"]').length).toBe(rows.length)
    );

    const tierAttrs = Array.from(container.querySelectorAll('[data-slot="tier-badge"]')).map((el) =>
      el.getAttribute('data-tier')
    );
    expect(tierAttrs).toEqual(['Deterministic', 'Fuzzy']);
    // Scores rendered
    expect(screen.getByText('0.97')).toBeInTheDocument();
    expect(screen.getByText('0.62')).toBeInTheDocument();
  });

  it('shows the empty state when no candidates are pending', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ items: [], totalCount: 0 }));

    const { container } = renderInbox(client);

    await waitFor(() =>
      expect(container.querySelector('[data-slot="query-data-table"]')).not.toBeNull()
    );
    expect(container.querySelectorAll('[data-slot="tier-badge"]').length).toBe(0);
  });

  it('dispatches the dismiss mutation when "Dismiss" is clicked', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ items: rows, totalCount: rows.length })
    );
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const { container } = renderInbox(client);

    await waitFor(() =>
      expect(container.querySelectorAll('[data-slot="tier-badge"]').length).toBe(rows.length)
    );

    const dismissButtons = screen.getAllByRole('button', {
      name: partiesTranslationsEn.Duplicates.Actions.Dismiss,
    });
    fireEvent.click(dismissButtons[0]!);

    await waitFor(() =>
      expect(client.post).toHaveBeenCalledWith(`/api/v1/parties/duplicates/${dupId1}/dismiss`)
    );
  });

  it('forwards the row to onMerge when the consumer wires the callback', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ items: rows, totalCount: rows.length })
    );

    const onMerge = vi.fn();
    const { container } = renderInbox(client, { onMerge });

    await waitFor(() =>
      expect(container.querySelectorAll('[data-slot="tier-badge"]').length).toBe(rows.length)
    );

    const mergeButtons = screen.getAllByRole('button', {
      name: partiesTranslationsEn.Duplicates.Actions.Merge,
    });
    fireEvent.click(mergeButtons[1]!);

    expect(onMerge).toHaveBeenCalledWith(rows[1]);
  });

  it('renders the error state when the QueryEngine call fails', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('boom'));

    renderInbox(client);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe(partiesTranslationsEn.Duplicates.ErrorState);
  });

  it('does not render Merge buttons when onMerge is omitted', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ items: rows, totalCount: rows.length })
    );

    const { container } = renderInbox(client);

    await waitFor(() =>
      expect(container.querySelectorAll('[data-slot="tier-badge"]').length).toBe(rows.length)
    );

    expect(
      screen.queryAllByRole('button', { name: partiesTranslationsEn.Duplicates.Actions.Merge })
    ).toHaveLength(0);
  });

  it('links Party columns to the detail page when partyDetailBasePath is provided', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ items: [rows[0]!], totalCount: 1 }));

    const { container } = renderInbox(client, { partyDetailBasePath: '/parties' });

    await waitFor(() =>
      expect(container.querySelectorAll('[data-slot="party-ref"]').length).toBe(2)
    );
    const links = Array.from(
      container.querySelectorAll<HTMLAnchorElement>('[data-slot="party-ref"]')
    );
    expect(links[0]!.getAttribute('href')).toBe(`/parties/${partyA}`);
    expect(links[1]!.getAttribute('href')).toBe(`/parties/${partyB}`);
  });
});
