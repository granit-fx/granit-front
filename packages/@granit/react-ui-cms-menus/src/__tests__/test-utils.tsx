import { TooltipProvider } from '@granit/react-ui';
import { render } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { cmsMenusTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Local UI render helper. The page tests stub the data layer (vi.mock
// @granit/react-cms + react-router-dom's useParams in-workspace), so only i18n
// (the package's own flat `cms:` bundle plus the few inline `cms:Common.*` keys
// the pages reference) and a router (Link/useNavigate) are needed.
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
        ...cmsMenusTranslationsEn,
        // Inline cms:Common.* strings the pages reference but that are owned by
        // the host's shared bundle, not this package's locales.
        'cms:Common.Cancel': 'Cancel',
        'cms:Common.Delete': 'Delete',
        'cms:Common.Loading': 'Loading…',
        'cms:Common.Required': 'Required.',
        'cms:Common.Save': 'Save',
        'cms:Common.Saving': 'Saving…',
        'cms:Sites.Title': 'Sites',
      },
    },
  },
  interpolation: { escapeValue: false },
});

export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  return render(ui, {
    wrapper: ({ children }: { readonly children: ReactNode }) => (
      <I18nextProvider i18n={testI18n}>
        <TooltipProvider>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </TooltipProvider>
      </I18nextProvider>
    ),
  });
}
