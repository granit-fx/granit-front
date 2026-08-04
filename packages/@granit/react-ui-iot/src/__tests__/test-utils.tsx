import { TooltipProvider } from '@granit/react-ui';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import { iotTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Local UI render helper. The tests stub the data layer (vi.mock @granit/react-iot
// in-workspace), so only i18n (the package's own flat bundle plus the few app-global
// Common.* keys the pages render, and the spec-resolver's NotEmpty message) and a
// router (useNavigate / useParams) are needed.
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
        ...iotTranslationsEn,
        'Common.Back': 'Back',
        'Common.Cancel': 'Cancel',
        'Common.NoResults': 'No results.',
        'Common.Save': 'Save',
        'Common.SearchPlaceholder': 'Search…',
        'Validation:Builtin:NotEmpty': "'{{PropertyName}}' must not be empty.",
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
