import { TooltipProvider } from '@granit/react-ui';
import { render } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { cmsHostnamesTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Local UI render helper. The page test stubs the data layer (vi.mock
// @granit/react-cms-hostnames + @granit/react-localization useDateFormatter), so
// only i18n (the package's own flat bundle plus the host-owned `cms:Common.*`
// keys this UI references inline) and a router (useParams/Link) are needed.
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
        ...cmsHostnamesTranslationsEn,
        'cms:Common.Saving': 'Saving…',
        'cms:Common.Actions': 'Actions',
        'cms:Common.Cancel': 'Cancel',
        'cms:Common.Remove': 'Remove',
      },
    },
  },
  interpolation: { escapeValue: false },
});

export function renderCmsHostnames(
  ui: ReactElement,
  { route = '/cms/sites/site-1/hostnames' }: { route?: string } = {}
) {
  return render(ui, {
    wrapper: ({ children }: { readonly children: ReactNode }) => (
      <I18nextProvider i18n={testI18n}>
        <TooltipProvider>
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route path="/cms/sites/:id/hostnames" element={children} />
              <Route path="*" element={children} />
            </Routes>
          </MemoryRouter>
        </TooltipProvider>
      </I18nextProvider>
    ),
  });
}
