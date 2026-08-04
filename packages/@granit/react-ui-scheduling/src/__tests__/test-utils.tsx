import { TooltipProvider } from '@granit/react-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import { schedulingTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Local render helper for the scheduling admin UI. Page/component tests stub the
// data layer (vi.mock('@granit/react-scheduling', …) and the query engine), so
// only i18n (the package's own flat Scheduling.* bundle plus the few host-owned
// Common.* keys the pages render), a router (Link / useParams) and a QueryClient
// are needed. useDateFormatter resolves a browser fallback with no
// TimezoneProvider, so date cells format without one.
// ---------------------------------------------------------------------------

const HOST_KEYS = {
  'Common.Back': 'Back',
  'Common.Cancel': 'Cancel',
  'Common.Close': 'Close',
  'Common.No': 'No',
  'Common.Refresh': 'Refresh',
  'Common.SearchPlaceholder': 'Search or filter...',
  'Common.Yes': 'Yes',
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
        ...schedulingTranslationsEn,
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
