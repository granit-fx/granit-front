import { TooltipProvider } from '@granit/react-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { openIddictAdminTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Local render helper for the OpenIddict admin UI. Page tests stub the data
// layer (vi.mock('@granit/react-openiddict-admin', …)) and the permission gate
// (vi.mock('@granit/react-authorization', …)), so only i18n (the package's own
// flat OpenIddict.* bundle plus the few host-owned Common.* keys the dialogs
// render), a router (useSearchParams on the consent/device pages) and a
// QueryClient (for the rare test that does not mock a hook) are needed.
// ---------------------------------------------------------------------------

const HOST_KEYS = {
  'Common.Add': 'Add',
  'Common.Cancel': 'Cancel',
  'Common.Save': 'Save',
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
        ...openIddictAdminTranslationsEn,
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
    // `delay: null` removes userEvent's inter-event real-timer waits, which
    // otherwise compound under v8 coverage instrumentation.
    user: userEvent.setup({ delay: null }),
  };
}
