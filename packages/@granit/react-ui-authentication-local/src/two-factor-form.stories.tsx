import { createApiClient } from '@granit/api-client';
import { LocalAuthProvider } from '@granit/react-authentication-local';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { fn } from 'storybook/test';

import { authLocalTranslationsEn } from './locales';
import { TwoFactorForm } from './two-factor-form';

import type { Meta, StoryObj } from '@storybook/react-vite';

const storyI18n = i18next.createInstance();
void storyI18n.use(initReactI18next).init({
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

const meta: Meta<typeof TwoFactorForm> = {
  title: 'Auth Local/TwoFactorForm',
  component: TwoFactorForm,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <QueryClientProvider client={queryClient}>
          <LocalAuthProvider config={{ client }}>
            <MemoryRouter>
              <div className="w-80">
                <Story />
              </div>
            </MemoryRouter>
          </LocalAuthProvider>
        </QueryClientProvider>
      </I18nextProvider>
    ),
  ],
  args: {
    serverError: null,
    setServerError: fn(),
    onBack: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Authenticator-app code entry (the default when no methods are advertised). */
export const Authenticator: Story = {
  args: { methods: ['Authenticator'] },
};

/** The user has enrolled multiple factors and can switch between them. */
export const MultipleMethods: Story = {
  args: { methods: ['Authenticator', 'Email', 'RecoveryCode'] },
};

/** A verification error surfaces above the code field. */
export const WithServerError: Story = {
  args: { methods: ['Authenticator'], serverError: 'Invalid verification code.' },
};
