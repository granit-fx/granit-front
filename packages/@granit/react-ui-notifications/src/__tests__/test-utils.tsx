import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { notificationsTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Local UI render helper. Tests stub the data layer (vi.mock
// @granit/react-notifications in-workspace); the bell/inbox/action render router
// Links so a MemoryRouter is supplied, and the preferences panel resolves an
// Axios client via the headless config, so a GranitClientProvider is supplied.
// i18n uses the package's own flat bundle plus the app-global Common.* and
// Components.Notifications.* keys the components render.
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
        ...notificationsTranslationsEn,
        'Common.Loading': 'Loading...',
        'Components.Notifications.Preferences.Type': 'Type',
      },
    },
  },
  interpolation: { escapeValue: false },
});

const client = createApiClient({ baseURL: '' });

export function renderNotifications(ui: ReactElement) {
  return {
    ...render(ui, {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <I18nextProvider i18n={testI18n}>
          <GranitClientProvider client={client}>
            <MemoryRouter>{children}</MemoryRouter>
          </GranitClientProvider>
        </I18nextProvider>
      ),
    }),
    user: userEvent.setup(),
  };
}
