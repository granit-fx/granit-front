import { TooltipProvider } from '@granit/react-ui';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { cmsRedirectsTranslationsEn } from '../locales';

import type { RedirectResponse } from '@granit/react-cms-redirects';
import type { ReactElement, ReactNode } from 'react';

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
  { route = '/cms/sites/site-1/redirects', path = '/cms/sites/:id/redirects' } = {}
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

/** Local fixtures mirroring @granit/react-cms-redirects/testing data. */
export const mockRedirects: RedirectResponse[] = [
  {
    id: '50000000-0000-4000-8000-000000000001',
    siteId: 'site-1',
    source: '/old-about',
    matchType: 'Exact',
    target: '/about',
    type: 'MovedPermanently',
    statusCode: 301,
    isActive: true,
    culture: null,
    origin: 'Manual',
    hitCount: 12,
    lastHitAt: '2026-05-01T09:30:00+00:00',
  },
  {
    id: '50000000-0000-4000-8000-000000000002',
    siteId: 'site-1',
    source: '/promo',
    matchType: 'Prefix',
    target: '/campaign-2026',
    type: 'Found',
    statusCode: 302,
    isActive: false,
    culture: 'en-GB',
    origin: 'Imported',
    hitCount: 0,
    lastHitAt: null,
  },
];
