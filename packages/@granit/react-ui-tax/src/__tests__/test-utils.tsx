import { TooltipProvider } from '@granit/react-ui';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { taxTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Local UI render helper. The tests stub the data layer (vi.mock
// @granit/react-tax / @granit/react-query-engine in-workspace), so only i18n (the
// package's own flat Tax.* bundle plus the host-owned Common.* / Operators.* keys
// the admin-kit smart-filter bar renders) and a router (the rates page reads
// :countryCode via useParams) are needed.
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
        ...taxTranslationsEn,
        'Common.No': 'No',
        'Common.SearchPlaceholder': 'Search or filter...',
        'Common.Yes': 'Yes',
        'Operators.Between': 'between',
        'Operators.Contains': 'contains',
        'Operators.EndsWith': 'ends with',
        'Operators.Eq': 'equals',
        'Operators.Gt': 'greater than',
        'Operators.Gte': 'greater or equal',
        'Operators.In': 'in',
        'Operators.Lt': 'less than',
        'Operators.Lte': 'less or equal',
        'Operators.StartsWith': 'starts with',
      },
    },
  },
  interpolation: { escapeValue: false },
});

/**
 * Renders the page UI inside i18n + tooltip + router providers. Pass `{ route }`
 * to seed a `:countryCode` route param for the rates detail card.
 */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/tax/rates' }: { route?: string } = {}
) {
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
