import { TooltipProvider } from '@granit/react-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { entitiesCustomizationAdminTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Local render helper for the entity-customization admin UI. Page/component
// tests stub the data layer (vi.mock of the headless hooks + permissions), so
// only i18n (the package's own flat customization:* / views:* bundle plus the
// few host-owned Common.* keys the pages render), a router (the views tab and
// dialogs mount under one) and a QueryClient are needed.
// ---------------------------------------------------------------------------

const HOST_KEYS = {
  'Common.Cancel': 'Cancel',
  'Common.Create': 'Create',
  'Common.Delete': 'Delete',
  'Common.Reset': 'Reset',
  'Common.Save': 'Save',
  'Common.Saving': 'Saving…',
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
        ...entitiesCustomizationAdminTranslationsEn,
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
