import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { TooltipProvider } from '@granit/react-ui';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { dataExchangeTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Local UI render helper. The page tests stub the data layer (vi.mock
// @granit/react-data-exchange in-workspace); the pages resolve an Axios client
// via useGranitClient, so a GranitClientProvider is supplied. i18n uses the
// package's own flat bundle. The history columns render Radix tooltips, so a
// TooltipProvider wraps the tree.
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
        ...dataExchangeTranslationsEn,
      },
    },
  },
  interpolation: { escapeValue: false },
});

const client = createApiClient({ baseURL: '' });

export function renderDataExchange(ui: ReactElement) {
  return {
    ...render(ui, {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <I18nextProvider i18n={testI18n}>
          <GranitClientProvider client={client}>
            <TooltipProvider>{children}</TooltipProvider>
          </GranitClientProvider>
        </I18nextProvider>
      ),
    }),
    // `delay: null` removes userEvent's inter-keystroke real-timer waits, which
    // otherwise compound under instrumented (coverage) runs and trip the 5s
    // per-test timeout on contended machines.
    user: userEvent.setup({ delay: null }),
  };
}
