import { createApiClient } from '@granit/api-client';
import { AccountProvider } from '@granit/react-account';
import { LocalAuthProvider } from '@granit/react-authentication-local';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { HeadlessLoginForm } from './headless-login-form';
import { authLocalTranslationsEn } from './locales';

import type { Meta, StoryObj } from '@storybook/react-vite';

const storyI18n = i18next.createInstance();
void storyI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: {
    en: {
      translation: {
        ...authLocalTranslationsEn,
        'Common.AppName': 'Granit',
        'Auth.LoginPage.PlatformTitle': 'Administration',
      },
    },
  },
  interpolation: { escapeValue: false },
});

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof HeadlessLoginForm> = {
  title: 'Auth Local/HeadlessLoginForm',
  component: HeadlessLoginForm,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <QueryClientProvider client={queryClient}>
          <AccountProvider config={{ client }}>
            <LocalAuthProvider config={{ client }}>
              <MemoryRouter>
                <Story />
              </MemoryRouter>
            </LocalAuthProvider>
          </AccountProvider>
        </QueryClientProvider>
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The full self-hosted login experience: credential form, passkey option, and
 * the direct-login demo, wrapped in the public auth layout.
 */
export const Default: Story = {};
