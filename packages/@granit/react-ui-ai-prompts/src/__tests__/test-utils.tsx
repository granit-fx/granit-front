import { TooltipProvider } from '@granit/react-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { aiPromptsAdminTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Local render helper for the AI Prompts admin UI. The page test stubs the data
// layer (vi.mock('@granit/react-ai-prompts', …) — including the heavy
// PromptCatalogue / PromptForm components) and the permissions hook, so only
// i18n (the package's own flat AiPrompts.* bundle), a TooltipProvider and a
// QueryClient are needed. The page renders no Common.*/Pagination.* keys
// directly (the catalogue owns those and is stubbed), so HOST_KEYS is empty.
// ---------------------------------------------------------------------------

const HOST_KEYS = {} as const;

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
        ...aiPromptsAdminTranslationsEn,
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

export function renderWithProviders(ui: ReactElement) {
  const queryClient = makeQueryClient();
  return {
    ...render(ui, {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <I18nextProvider i18n={testI18n}>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>{children}</TooltipProvider>
          </QueryClientProvider>
        </I18nextProvider>
      ),
    }),
    user: userEvent.setup({ delay: null }),
  };
}
