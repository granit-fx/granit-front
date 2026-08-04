import { TooltipProvider } from '@granit/react-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import { accountTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Local render helper for the account self-service UI. Page/component tests stub
// the data layer (vi.mock('@granit/react-account', …) /
// vi.mock('@granit/react-identity', …)), so only i18n (the package's own flat
// Account.*/Auth.* bundle plus the few host-owned Common.* keys the pages
// render, and the Sessions.*/Users.Devices.* labels owned by
// @granit/react-ui-identity's session/device cards), a router
// (Link / useSearchParams) and a QueryClient are needed. useDateFormatter
// resolves a browser fallback with no TimezoneProvider, so date cells format
// without one.
// ---------------------------------------------------------------------------

const HOST_KEYS = {
  'Common.Cancel': 'Cancel',
  'Common.Copied': 'Copied!',
  'Common.Copy': 'Copy',
  'Common.CopyAll': 'Copy all',
  'Common.Delete': 'Delete',
  'Common.Done': 'Done',
  'Common.Edit': 'Edit',
  'Common.Loading': 'Loading...',
  'Common.No': 'No',
  'Common.Save': 'Save',
  'Common.Yes': 'Yes',
  // Session/device card labels — owned by @granit/react-ui-identity, rendered by
  // MySessionsCard / MyDevicesCard via useSessionsCardLabels / useDevicesCardLabels.
  'Sessions.Active': 'Active',
  'Sessions.AdminTitle': 'Active Sessions',
  'Sessions.Current': 'Current',
  'Sessions.Empty': 'No active sessions',
  'Sessions.Inactive': 'Inactive',
  'Sessions.IpAddress': 'IP address',
  'Sessions.LastActivity': 'Last activity',
  'Sessions.MyTitle': 'My Sessions',
  'Sessions.Revoke': 'Revoke',
  'Sessions.RevokeAll': 'Revoke all',
  'Sessions.RevokeAllOthers': 'Revoke all others',
  'Sessions.Started': 'Started',
  'Sessions.UnknownDevice': 'Unknown device',
  'Users.Devices.Empty': 'No device activity',
  'Users.Devices.MyTitle': 'My devices',
  'Users.Devices.On': 'on',
  'Users.Devices.Kind.ApiClient': 'API client',
  'Users.Devices.Kind.Browser': 'Browser',
  'Users.Devices.Kind.BrowserExtension': 'Browser extension',
  'Users.Devices.Kind.DesktopApp': 'Desktop app',
  'Users.Devices.Kind.Embedded': 'Embedded',
  'Users.Devices.Kind.MobileApp': 'Mobile app',
  'Users.Devices.Kind.Tv': 'TV',
  'Users.Devices.Kind.Unknown': 'Unknown device',
  'Users.Devices.Kind.Wearable': 'Wearable',
  'Users.Devices.Sessions': '{{count}} session',
  'Users.Devices.Sessions_other': '{{count}} sessions',
  'Users.Devices.Title': 'Device Activity',
} as const;

export const testI18n = i18next.createInstance();
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
        ...accountTranslationsEn,
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
