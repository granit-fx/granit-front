import { createApiClient } from '@granit/api-client';
import { AccountProvider } from '@granit/react-account';
import { LocalAuthProvider } from '@granit/react-authentication-local';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { fn } from 'storybook/test';

import { CredentialForm } from './credential-form';
import { authLocalTranslationsEn } from './locales';

import type { Meta, StoryObj } from '@storybook/react-vite';

const storyI18n = i18next.createInstance();
await storyI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: { ...authLocalTranslationsEn } } },
  interpolation: { escapeValue: false },
});

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof CredentialForm> = {
  title: 'Auth Local/CredentialForm',
  component: CredentialForm,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <QueryClientProvider client={queryClient}>
          <AccountProvider config={{ client }}>
            <LocalAuthProvider config={{ client }}>
              <MemoryRouter>
                <div className="w-80">
                  <Story />
                </div>
              </MemoryRouter>
            </LocalAuthProvider>
          </AccountProvider>
        </QueryClientProvider>
      </I18nextProvider>
    ),
  ],
  args: {
    serverError: null,
    setServerError: fn(),
    onTwoFactorRequired: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Login / password form with the optional passkey path. */
export const Default: Story = {};

/** A server-side error (e.g. invalid credentials) surfaces above the form. */
export const WithServerError: Story = {
  args: { serverError: 'Invalid username or password.' },
};
