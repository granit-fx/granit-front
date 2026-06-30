import { CORPORATE_SITE_ID, mockRedirects } from '@granit/react-cms-redirects/testing';
import { TooltipProvider } from '@granit/react-ui';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { cmsRedirectsTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

export { CORPORATE_SITE_ID, mockRedirects };

// Local UI render helper. The tests stub the data layer (vi.mock
// @granit/react-cms-redirects in-workspace), so only i18n (the package's own flat
// bundle plus the host-owned cms:Common.* keys the components render) and a router
// (the page reads :id via useParams) are needed.
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
        ...cmsRedirectsTranslationsEn,
        'cms:Common.Actions': 'Actions',
        'cms:Common.Cancel': 'Cancel',
        'cms:Common.Delete': 'Delete',
        'cms:Common.Disable': 'Disable',
        'cms:Common.Disabled': 'Disabled',
        'cms:Common.Edit': 'Edit',
        'cms:Common.Enable': 'Enable',
        'cms:Common.Enabled': 'Enabled',
        'cms:Common.Optional': 'Optional',
        'cms:Common.Required': 'Required.',
        'cms:Common.Save': 'Save',
        'cms:Common.Saving': 'Saving…',
      },
    },
  },
  interpolation: { escapeValue: false },
});

/**
 * Renders the page UI inside a route so `useParams({ id })` resolves. The default
 * `path`/`route` map a site id; pass `{ route, path }` to override.
 */
export function renderCmsRedirects(
  ui: ReactElement,
  { route = `/cms/sites/${CORPORATE_SITE_ID}/redirects`, path = '/cms/sites/:id/redirects' } = {}
) {
  return {
    ...render(ui, {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <I18nextProvider i18n={testI18n}>
          <TooltipProvider>
            <MemoryRouter initialEntries={[route]}>
              <Routes>
                <Route path={path} element={children} />
              </Routes>
            </MemoryRouter>
          </TooltipProvider>
        </I18nextProvider>
      ),
    }),
    user: userEvent.setup(),
  };
}
