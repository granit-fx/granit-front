import { TooltipProvider } from '@granit/react-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import { timelineAdminTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Render helper for the timeline UI: the package's own flat Timeline.* bundle in
// context (separators disabled, dotted keys verbatim), plus a QueryClient,
// TooltipProvider and router — the components use react-query, tooltips and
// <Link>. Tests that exercise EntityTimeline mock @granit/react-timeline, so no
// real TimelineProvider/API client is needed here.
const testI18n = i18next.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: {
    en: { translation: { ...timelineAdminTranslationsEn } },
  },
  interpolation: { escapeValue: false },
});

export { testI18n };

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
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <MemoryRouter>{children}</MemoryRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </I18nextProvider>
      ),
    }),
    user: userEvent.setup({ delay: null }),
  };
}
