import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import { authLocalTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// These pages render their own sonner <Toaster>, which calls window.matchMedia
// on mount. jsdom leaves it unimplemented; force a callable stub (the global
// setup guard is a no-op when the property already exists as undefined).
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// Host-owned keys the package's pages read but does not own (the showcase keeps
// these under `Common.*` / `Account.TwoFactor.*`). Inlined here so the ported
// tests resolve the branding header without coupling to the host bundle.
const hostOwnedEn = {
  'Common.AppName': 'Granit Showcase Admin',
  'Common.Loading': 'Loading…',
  'Common.Reset': 'Reset',
} as const;

// Flat-key i18n (separators disabled), mirroring the host runtime. The page
// tests stub the data layer (vi.mock @granit/react-account /
// @granit/react-authentication-local), so only i18n and a router (Link /
// useSearchParams) are needed.
export const testI18n = i18next.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: { ...authLocalTranslationsEn, ...hostOwnedEn } } },
  interpolation: { escapeValue: false },
});

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  const queryClient = createTestQueryClient();
  return {
    ...render(ui, {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={testI18n}>
            <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
          </I18nextProvider>
        </QueryClientProvider>
      ),
    }),
    user: userEvent.setup(),
  };
}
