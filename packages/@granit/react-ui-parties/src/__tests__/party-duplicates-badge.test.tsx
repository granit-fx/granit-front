import { PartiesProvider, partiesTranslationsEn } from '@granit/react-parties';
import { createTestQueryClient } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import i18next from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { PartyDuplicatesBadge } from '../components/party-duplicates-badge';

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

const candidateBuilder = (
  overrides: Partial<PartyDuplicateCandidateResponse>
): PartyDuplicateCandidateResponse => ({
  id: toEntityId<'PartyDuplicateCandidate'>('dup-x') as PartyDuplicateCandidateId,
  partyId: partyA,
  candidateId: partyB,
  score: 0.8,
  tier: 'Blocking',
  signals: [],
  dismissedAt: null,
  createdAt: toISODateString('2026-04-26T08:00:00Z'),
  updatedAt: null,
  ...overrides,
});

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

function renderBadge(client: AxiosInstance, props?: { href?: string }) {
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
  return render(<PartyDuplicatesBadge partyId={partyA} href={props?.href} />, { wrapper: Wrapper });
}

describe('PartyDuplicatesBadge', () => {
  it('renders the count when the party has pending candidates', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse([
        candidateBuilder({ tier: 'Deterministic' }),
        candidateBuilder({
          id: toEntityId<'PartyDuplicateCandidate'>('dup-y') as PartyDuplicateCandidateId,
          tier: 'Fuzzy',
        }),
      ])
    );

    const { container } = renderBadge(client);

    const badge = await waitFor(() => {
      const el = container.querySelector('[data-slot="party-duplicates-badge"]');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });

    expect(badge.textContent).toMatch(/Potential duplicates \(2\)/);
    // At least one non-Fuzzy → amber tone
    expect(badge.getAttribute('data-tone')).toBe('amber');
  });

  it('uses the muted tone when only Fuzzy candidates are pending', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([candidateBuilder({ tier: 'Fuzzy' })]));

    const { container } = renderBadge(client);
    const badge = await waitFor(() => {
      const el = container.querySelector('[data-slot="party-duplicates-badge"]');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    expect(badge.getAttribute('data-tone')).toBe('muted');
  });

  it('renders nothing when there are no pending candidates', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

    const { container } = renderBadge(client);

    await waitFor(() => expect(client.get).toHaveBeenCalled());
    expect(container.querySelector('[data-slot="party-duplicates-badge"]')).toBeNull();
  });

  it('hides dismissed-only rows', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse([candidateBuilder({ dismissedAt: toISODateString('2026-04-26T10:00:00Z') })])
    );

    const { container } = renderBadge(client);
    await waitFor(() => expect(client.get).toHaveBeenCalled());
    expect(container.querySelector('[data-slot="party-duplicates-badge"]')).toBeNull();
  });

  it('wraps the pill in a router link when href is supplied', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse([candidateBuilder({ tier: 'Deterministic' })])
    );

    const { container } = renderBadge(client, { href: '/parties/duplicates' });
    const anchor = await waitFor(() => {
      const el = container.querySelector('a');
      expect(el).not.toBeNull();
      return el as HTMLAnchorElement;
    });
    expect(anchor.getAttribute('href')).toBe('/parties/duplicates');
    expect(anchor.querySelector('[data-slot="party-duplicates-badge"]')).not.toBeNull();
  });
});
