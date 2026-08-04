import { TooltipProvider } from '@granit/react-ui';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import { cmsPagesTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Local UI render helper. The page tests stub the data layer (vi.mock
// @granit/react-cms in-workspace), so only i18n (the package's own flat bundle
// plus the handful of app-global `cms:Common.*` keys the pages render) and a
// router (useParams / useSearchParams / useNavigate / Link) are needed.
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
        ...cmsPagesTranslationsEn,
        'cms:Common.Cancel': 'Cancel',
        'cms:Common.Delete': 'Delete',
        'cms:Common.Edit': 'Edit',
        'cms:Common.Loading': 'Loading…',
        'cms:Common.Optional': 'Optional',
        'cms:Common.Required': 'Required.',
        'cms:Common.Save': 'Save',
        'cms:Common.Saving': 'Saving…',
      },
    },
  },
  interpolation: { escapeValue: false },
});

export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  return {
    ...render(ui, {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <I18nextProvider i18n={testI18n}>
          <TooltipProvider>
            <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
          </TooltipProvider>
        </I18nextProvider>
      ),
    }),
    user: userEvent.setup(),
  };
}
