import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { cmsSitesTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Local UI render helper. The page tests stub the data layer (vi.mock
// @granit/react-cms in-workspace), so only i18n (the package's own flat bundle,
// flat keys with separators disabled) and a router (useNavigate / useParams /
// Link) are needed. The pages use plain `title=` attributes, not the Tooltip
// component, so no TooltipProvider is required.
const testI18n = i18next.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: { ...cmsSitesTranslationsEn } } },
  interpolation: { escapeValue: false },
});

export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  return {
    ...render(ui, {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <I18nextProvider i18n={testI18n}>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </I18nextProvider>
      ),
    }),
    user: userEvent.setup(),
  };
}
