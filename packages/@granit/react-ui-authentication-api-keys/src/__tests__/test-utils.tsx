import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { apiKeysTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Local UI render helper. The page tests stub the data layer (vi.mock
// @granit/react-authentication-api-keys in-workspace), so only i18n (the
// package's own flat ApiKeys.* bundle plus the host-owned Common.* keys these
// pages reference, flat keys with separators disabled), a router
// (useNavigate / useParams), and the GranitClientProvider (the pages call
// useGranitClient at mount even though the hooks are stubbed) are needed.
const Common = {
  'Common.Add': 'Add',
  'Common.All': 'All',
  'Common.Cancel': 'Cancel',
  'Common.Details': 'Details',
  'Common.Edit': 'Edit',
  'Common.Next': 'Next',
  'Common.Previous': 'Previous',
  'Common.Save': 'Save',
  'Common.SearchPlaceholder': 'Search or filter...',
} as const;

const testI18n = i18next.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: { ...apiKeysTranslationsEn, ...Common } } },
  interpolation: { escapeValue: false },
});

const testClient = createApiClient({ baseURL: '' });

export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  return {
    ...render(ui, {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <I18nextProvider i18n={testI18n}>
          <GranitClientProvider client={testClient}>
            <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
          </GranitClientProvider>
        </I18nextProvider>
      ),
    }),
    user: userEvent.setup(),
  };
}
