import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { featuresTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Local UI render helper. The page tests stub the data layer (vi.mock
// @granit/react-features in-workspace); the page resolves an Axios client via
// useGranitClient, so a GranitClientProvider is supplied. The detail page uses
// react-router-dom (useParams / useNavigate / Link), so a MemoryRouter wraps the
// tree. i18n uses the package's own flat bundle plus the few app-global Common.*
// keys the override dialog renders.
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
        ...featuresTranslationsEn,
        'Common.Cancel': 'Cancel',
      },
    },
  },
  interpolation: { escapeValue: false },
});

const client = createApiClient({ baseURL: '' });

export function renderFeatures(
  ui: ReactElement,
  { route = '/' }: { readonly route?: string } = {}
) {
  return {
    ...render(ui, {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <I18nextProvider i18n={testI18n}>
          <GranitClientProvider client={client}>
            <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
          </GranitClientProvider>
        </I18nextProvider>
      ),
    }),
    user: userEvent.setup(),
  };
}
