import { createTestQueryClient } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import i18next from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { PartyDuplicatesBadge } from '../components/party-duplicates-badge';
import { partiesTranslationsEn } from '../locales/en';
import { PartiesProvider } from '../providers/parties-provider';

import type { PartiesConfig } from '../providers/parties-provider';
import type {
  PartyDuplicateCandidateId,
  PartyDuplicateCandidateResponse,
  PartyId,
} from '@granit/parties';
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

function renderBadge(
  client: AxiosInstance,
  props?: {
    href?: string;
    renderLink?: (linkProps: { href: string; children: ReactNode }) => ReactNode;
  }
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
    <PartyDuplicatesBadge partyId={partyA} href={props?.href} renderLink={props?.renderLink} />,
    { wrapper: Wrapper }
  );
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

    // Wait for the query to settle then assert no pill
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

  it('uses renderLink when provided alongside href', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse([candidateBuilder({ tier: 'Deterministic' })])
    );

    const renderLink = vi.fn(({ href, children }: { href: string; children: ReactNode }) => (
      <button data-slot="custom-link" data-href={href} type="button">
        {children}
      </button>
    ));

    const { container } = renderBadge(client, { href: '/inbox', renderLink });

    const wrapper = await waitFor(() => {
      const el = container.querySelector('[data-slot="custom-link"]');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });

    expect(wrapper.getAttribute('data-href')).toBe('/inbox');
    expect(renderLink).toHaveBeenCalled();
    // The inner pill is still rendered as a span inside the consumer's wrapper.
    expect(wrapper.querySelector('[data-slot="party-duplicates-badge"]')?.tagName).toBe('SPAN');
  });

  it('renders as an anchor when href is supplied', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse([candidateBuilder({ tier: 'Deterministic' })])
    );

    const { container } = renderBadge(client, { href: '/admin/parties/duplicates?filter=…' });
    const badge = await waitFor(() => {
      const el = container.querySelector('[data-slot="party-duplicates-badge"]');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    expect(badge.tagName).toBe('A');
    expect((badge as HTMLAnchorElement).getAttribute('href')).toBe(
      '/admin/parties/duplicates?filter=…'
    );
  });
});
