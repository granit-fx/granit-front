import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { TooltipProvider } from '@granit/react-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { localizationAdminTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Local render helper for the localization admin UI. Page/component tests stub
// the data layer (vi.mock('@granit/react-query-engine', …) and the languages
// context), and the override dialogs resolve an Axios client via useGranitClient,
// so a GranitClientProvider is supplied. Only i18n (the package's own flat
// Localization.* bundle plus the few host-owned Common.*/DataExchange.* keys the
// pages render) and a QueryClient are needed.
// ---------------------------------------------------------------------------

const HOST_KEYS = {
  'Common.Cancel': 'Cancel',
  'Common.Confirm': 'Confirm',
  'Common.Create': 'Create',
  'Common.Edit': 'Edit',
  'Common.No': 'No',
  'Common.Save': 'Save',
  'Common.SearchPlaceholder': 'Search or filter...',
  'Common.Yes': 'Yes',
  'DataExchange.Export.Label': 'Export',
  'DataExchange.Import.Label': 'Import',
} as const;

const testI18n = i18next.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: {
    en: {
      translation: {
        ...localizationAdminTranslationsEn,
        ...HOST_KEYS,
      },
    },
  },
  interpolation: { escapeValue: false },
});

const client = createApiClient({ baseURL: '' });

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

export function renderWithProviders(ui: ReactElement) {
  const queryClient = makeQueryClient();
  return {
    ...render(ui, {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <I18nextProvider i18n={testI18n}>
          <GranitClientProvider client={client}>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>{children}</TooltipProvider>
            </QueryClientProvider>
          </GranitClientProvider>
        </I18nextProvider>
      ),
    }),
    user: userEvent.setup({ delay: null }),
  };
}
