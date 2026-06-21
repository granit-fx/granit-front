import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { TooltipProvider } from '@granit/react-ui';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { authorizationTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Local UI render helper. Tests stub the data layer (vi.mock
// @granit/react-authorization / @granit/react-identity in-workspace); the
// role-metadata page additionally resolves an Axios client via useGranitClient,
// so a GranitClientProvider is supplied. i18n uses the package's own flat bundle
// plus the app-global Common.* keys the pages render.
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
        ...authorizationTranslationsEn,
        'Common.Yes': 'Yes',
        'Common.No': 'No',
        'Common.SearchPlaceholder': 'Search…',
      },
    },
  },
  interpolation: { escapeValue: false },
});

const client = createApiClient({ baseURL: '' });

export function renderAuthorization(ui: ReactElement) {
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
    user: userEvent.setup(),
  };
}
