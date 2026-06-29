import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient, axiosResponse } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import i18next from 'i18next';
import * as React from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { AddressAutocompleteInput } from '../components/address-autocomplete-input';
import { geocodingTranslationsEn } from '../locales/en';
import { GeocodingProvider } from '../providers/geocoding-provider';
import { sampleSuggestions } from '../testing/data';

import type { AxiosInstance } from '@granit/api-client';
import type { GeocodingSuggestionResponse } from '@granit/geocoding';

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      lng: 'en',
      fallbackLng: 'en',
      ns: ['geocoding'],
      defaultNS: 'geocoding',
      resources: { en: { geocoding: geocodingTranslationsEn } },
      interpolation: { escapeValue: false },
      returnNull: false,
    });
  }
});

function httpError(status: number): unknown {
  return { response: { status } };
}

function renderInput(client: AxiosInstance, onSelect = vi.fn()) {
  const queryClient = createTestQueryClient();

  function Harness() {
    const [value, setValue] = React.useState('');
    return (
      <AddressAutocompleteInput
        aria-label="Address"
        value={value}
        onValueChange={setValue}
        onSelect={onSelect}
        debounceMs={0}
      />
    );
  }

  render(
    <I18nextProvider i18n={i18next}>
      <QueryClientProvider client={queryClient}>
        <GeocodingProvider config={{ client, basePath: '/api/v1/geocoding' }}>
          <Harness />
        </GeocodingProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );

  return { onSelect };
}

function typeAddress(text: string): void {
  const input = screen.getByRole('combobox');
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: text } });
}

describe('AddressAutocompleteInput', () => {
  it('shows suggestions as the user types', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ suggestions: sampleSuggestions }));

    renderInput(client);
    typeAddress('rue de la');

    expect(await screen.findByText(sampleSuggestions[0]!.label)).toBeInTheDocument();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(sampleSuggestions.length);
  });

  it('fills the form from the structured components on select', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ suggestions: sampleSuggestions }));
    const onSelect = vi.fn<(s: GeocodingSuggestionResponse) => void>();

    renderInput(client, onSelect);
    typeAddress('rue de la');

    const option = await screen.findByText(sampleSuggestions[0]!.label);
    fireEvent.mouseDown(option);

    expect(onSelect).toHaveBeenCalledWith(sampleSuggestions[0]);
    expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe(
      sampleSuggestions[0]!.label
    );
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows a no-results message when the query returns nothing', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ suggestions: [] }));

    renderInput(client);
    typeAddress('zzzzzz');

    expect(await screen.findByText(geocodingTranslationsEn.NoResults)).toBeInTheDocument();
  });

  it('shows an error message when the request fails', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(httpError(500));

    renderInput(client);
    typeAddress('rue de la');

    expect(await screen.findByRole('alert')).toHaveTextContent(geocodingTranslationsEn.Error);
  });

  it('falls back to a plain input (no listbox) when the endpoint is absent (404)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(httpError(404));

    renderInput(client);
    typeAddress('rue de la');

    await waitFor(() => expect(client.get).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });
});
