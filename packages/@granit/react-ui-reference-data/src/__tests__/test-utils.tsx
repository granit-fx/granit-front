import { TooltipProvider } from '@granit/react-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { referenceDataTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Local render helper for the reference-data admin toolkit. Component tests stub
// the data layer, so only i18n (the toolkit's own flat ReferenceData.Common.*
// bundle plus the few host-owned Common.*/DataExchange.*/Pagination.* keys the
// shells render), a router (Link / useNavigate) and a QueryClient are needed.
// ---------------------------------------------------------------------------

const HOST_KEYS = {
  'Common.Cancel': 'Cancel',
  'Common.No': 'No',
  'Common.NoResults': 'No results',
  'Common.Save': 'Save',
  'Common.SearchPlaceholder': 'Search or filter...',
  'Common.Yes': 'Yes',
  'DataExchange.Export.Label': 'Export',
  'DataExchange.Import.Label': 'Import',
  'Pagination.Next': 'Next',
  'Pagination.Previous': 'Previous',
  'Pagination.Showing': 'Showing {{from}}-{{to}} of {{total}}',
} as const;

export const testI18n = i18next.createInstance();
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
        ...referenceDataTranslationsEn,
        ...HOST_KEYS,
      },
    },
  },
  interpolation: { escapeValue: false },
});

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  const queryClient = makeQueryClient();
  return {
    ...render(ui, {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <I18nextProvider i18n={testI18n}>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </I18nextProvider>
      ),
    }),
    user: userEvent.setup({ delay: null }),
  };
}
