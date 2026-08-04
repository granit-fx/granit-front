import { TooltipProvider } from '@granit/react-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import { identityAdminTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Local render helper for the identity admin UI. Page/component tests stub the
// data layer (vi.mock('@granit/react-identity', …)), so only i18n (the package's
// own flat Identity.*/Users.*/Sessions.* bundle plus the few host-owned
// Common.*/DataExchange.*/Pagination.*/Timeline.* keys the pages render), a
// router (Link / useParams / useNavigate) and a QueryClient (for the rare test
// that does not mock a hook) are needed. useDateFormatter resolves a browser
// fallback with no TimezoneProvider, so date cells format without one.
// ---------------------------------------------------------------------------

const HOST_KEYS = {
  'Common.Actions': 'Actions',
  'Common.Back': 'Back',
  'Common.Cancel': 'Cancel',
  'Common.Confirm': 'Confirm',
  'Common.Edit': 'Edit',
  'Common.Email': 'Email',
  'Common.Error': 'An error occurred',
  'Common.Loading': 'Loading...',
  'Common.Name': 'Name',
  'Common.NoResults': 'No results found',
  'Common.Save': 'Save',
  'Common.SearchPlaceholder': 'Search or filter...',
  'DataExchange.Export.Label': 'Export',
  'DataExchange.Import.Label': 'Import',
  'Pagination.Next': 'Next',
  'Pagination.Previous': 'Previous',
  'Pagination.Showing': 'Showing {{from}}-{{to}} of {{total}}',
  'Timeline.Title': 'Timeline',
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
        ...identityAdminTranslationsEn,
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
    // otherwise compound under v8 coverage instrumentation and intermittently
    // trip waitFor timeouts on the pagination flows.
    user: userEvent.setup({ delay: null }),
  };
}

/**
 * Provider wrapper for `renderHook`: the same i18n bundle as the page tests, so
 * label-string hooks resolve the package's flat keys (and their humanized
 * fallbacks for unknown codes) without a full DOM render.
 */
export function HookProviders({ children }: { readonly children: ReactNode }) {
  return <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>;
}
