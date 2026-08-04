import { TooltipProvider } from '@granit/react-ui';
import { render } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import { hostnamesTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Local UI render helper. The page test stubs the data layer (vi.mock
// @granit/react-hostnames + @granit/react-authorization in-workspace), so only
// i18n (the package's own flat bundle) and a router (useSearchParams) are needed.
const testI18n = i18next.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: { ...hostnamesTranslationsEn } } },
  interpolation: { escapeValue: false },
});

export function renderHostnames(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
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
