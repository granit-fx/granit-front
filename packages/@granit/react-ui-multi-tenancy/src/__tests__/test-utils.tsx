import { TooltipProvider } from '@granit/react-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { multiTenancyTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Local render helper for the multi-tenancy admin UI. Page/component tests stub
// the data layer (vi.mock('@granit/react-multi-tenancy', …), the query engine
// and the export feature), so only i18n (the package's own flat Tenants.* bundle
// plus the few host-owned Common.*/DataExchange.*/Timeline.* keys the pages
// render), a router (Link / useParams / useNavigate) and a QueryClient are
// needed. useDateFormatter resolves a browser fallback with no TimezoneProvider,
// so date cells format without one.
// ---------------------------------------------------------------------------

const HOST_KEYS = {
  'Common.Actions': 'Actions',
  'Common.Cancel': 'Cancel',
  'Common.Loading': 'Loading...',
  'Common.No': 'No',
  'Common.Save': 'Save',
  'Common.SearchPlaceholder': 'Search or filter...',
  'Common.Yes': 'Yes',
  'DataExchange.Export.Label': 'Export',
  'Timeline.Title': 'Activity',
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
        ...multiTenancyTranslationsEn,
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
