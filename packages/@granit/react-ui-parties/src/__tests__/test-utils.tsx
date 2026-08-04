import { TooltipProvider } from '@granit/react-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import { partiesAdminTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Local render helper for the parties admin UI. Page/component tests stub the
// data layer (vi.mock('@granit/react-parties', …),
// vi.mock('@granit/react-taxonomy', …) and
// vi.mock('@granit/react-authorization', …)), so only i18n (the package's own
// flat Parties.* bundle plus the few host-owned Common.* / Validation.* keys
// the pages render), a router (Link / useNavigate / useParams) and a
// QueryClient are needed.
// ---------------------------------------------------------------------------

const HOST_KEYS = {
  'Common.Add': 'Add',
  'Common.All': 'All',
  'Common.Cancel': 'Cancel',
  'Common.Delete': 'Delete',
  'Common.Edit': 'Edit',
  'Common.Loading': 'Loading...',
  'Common.Next': 'Next',
  'Common.Save': 'Save',
  'Validation.InvalidUrl': 'Enter a valid URL',
  'Validation.Required': 'This field is required',
  // Builtin codes the spec-driven resolver (createConstraintsResolver) emits.
  // In production these are provided by the host app's @granit/validation bundle.
  'Validation:Builtin:NotEmpty': "'{{PropertyName}}' must not be empty.",
  'Validation:Builtin:MaximumLength':
    "'{{PropertyName}}' must be {{maxLength}} characters or fewer.",
  'Validation:Builtin:MinimumLength':
    "'{{PropertyName}}' must be at least {{minLength}} characters.",
  'Validation:Builtin:RegularExpression': "'{{PropertyName}}' is not in the correct format.",
  'Validation:Builtin:Email': "'{{PropertyName}}' is not a valid email address.",
} as const;

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
        ...partiesAdminTranslationsEn,
        ...HOST_KEYS,
      },
    },
  },
  interpolation: { escapeValue: false },
});

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  const queryClient = makeQueryClient();
  return {
    ...render(ui, {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <I18nextProvider i18n={testI18n}>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </I18nextProvider>
      ),
    }),
    user: userEvent.setup({ delay: null }),
  };
}
