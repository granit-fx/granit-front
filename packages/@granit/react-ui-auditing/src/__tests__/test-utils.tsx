import { render } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { auditingTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Local UI render helper — light on purpose. The audit page tests stub the
// data layer (vi.mock @granit/react-auditing), so no QueryClient / api client
// is needed; only i18n (the package's own flat bundle, so `t('Audit.*')`
// resolves to real strings) and a router (for <Link> / useParams). Keeping it
// local avoids adding @granit/react-api-client/router deps to the shared
// @granit/react-testing package (which would entangle the api-client ↔ testing
// dependency cycle).
const testI18n = i18next.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: { ...auditingTranslationsEn } } },
  interpolation: { escapeValue: false },
});

export function renderAudit(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  return render(ui, {
    wrapper: ({ children }: { readonly children: ReactNode }) => (
      <I18nextProvider i18n={testI18n}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </I18nextProvider>
    ),
  });
}
