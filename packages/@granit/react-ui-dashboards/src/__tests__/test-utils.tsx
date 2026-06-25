import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { dashboardsTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Local UI render helper. Tests stub the data layer (vi.mock
// @granit/react-dashboards in-workspace), so the headless hooks never resolve a
// real Axios client / DashboardsProvider — no GranitClientProvider is needed.
// The pages navigate via react-router (useNavigate / useParams / <Link>), so a
// MemoryRouter wraps the tree. i18n uses the package's own flat bundle plus the
// app-global Common.* keys the pages render.
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
        ...dashboardsTranslationsEn,
        'Common.Archive': 'Archive',
        'Common.Back': 'Back',
        'Common.Cancel': 'Cancel',
        'Common.Discard': 'Discard',
        'Common.Done': 'Done',
        'Common.Edit': 'Edit',
        'Common.Import': 'Import',
        'Common.KeepEditing': 'Keep editing',
        'Common.Publish': 'Publish',
        'Common.Remove': 'Remove',
        'Common.Restore': 'Restore',
        'Common.Resync': 'Re-sync',
        'Common.Save': 'Save',
        'Common.Saving': 'Saving…',
        'Common.View': 'View',
      },
    },
  },
  interpolation: { escapeValue: false },
});

export function renderDashboards(ui: ReactElement) {
  return {
    ...render(ui, {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <I18nextProvider i18n={testI18n}>
          <MemoryRouter>{children}</MemoryRouter>
        </I18nextProvider>
      ),
    }),
    user: userEvent.setup(),
  };
}
