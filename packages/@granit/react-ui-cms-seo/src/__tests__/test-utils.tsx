import { TooltipProvider } from '@granit/react-ui';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import { cmsSeoTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Local UI render helper. The page test stubs the data layer (vi.mock
// @granit/react-cms-seo), so only i18n (the package's own flat bundle plus the
// handful of `cms:Common.*` keys the page references, which live in the host's
// bundle in production) and a router (useParams) are needed.
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
        ...cmsSeoTranslationsEn,
        'cms:Common.Actions': 'Actions',
        'cms:Common.Cancel': 'Cancel',
        'cms:Common.Delete': 'Delete',
        'cms:Common.Loading': 'Loading…',
        'cms:Common.Save': 'Save',
        'cms:Common.Saving': 'Saving…',
      },
    },
  },
  interpolation: { escapeValue: false },
});

export function renderCmsSeo(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  return {
    user: userEvent.setup(),
    ...render(ui, {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <I18nextProvider i18n={testI18n}>
          <TooltipProvider>
            <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
          </TooltipProvider>
        </I18nextProvider>
      ),
    }),
  };
}
