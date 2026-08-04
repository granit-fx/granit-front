import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { I18nextProvider } from '@granit/react-localization';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { MemoryRouter } from 'react-router';

import { notificationsTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Global singleton (not createInstance) so I18nextProvider and useTranslation share the same react-i18next context.
if (!i18next.isInitialized) {
  void i18next.init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['translation'],
    defaultNS: 'translation',
    nsSeparator: false,
    keySeparator: false,
    initImmediate: false,
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
}

const client = createApiClient({ baseURL: '' });

export function renderNotifications(ui: ReactElement) {
  return {
    ...render(ui, {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <I18nextProvider i18n={i18next}>
          <GranitClientProvider client={client}>
            <MemoryRouter>{children}</MemoryRouter>
          </GranitClientProvider>
        </I18nextProvider>
      ),
    }),
    user: userEvent.setup(),
  };
}
