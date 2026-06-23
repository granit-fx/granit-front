import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { authLocalTranslationsEn } from './locales';
import { TokenConfirmationResult } from './token-confirmation-result';

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

const meta: Meta<typeof TokenConfirmationResult> = {
  title: 'Auth Local/TokenConfirmationResult',
  component: TokenConfirmationResult,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </I18nextProvider>
    ),
  ],
  args: {
    i18nPrefix: 'Auth.ConfirmEmail',
    returnUrl: null,
    isLinkValid: true,
  },
  argTypes: {
    status: { control: 'select', options: ['loading', 'success', 'error'] },
    isLinkValid: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Verifying the token (initial state). */
export const Loading: Story = { args: { status: 'loading' } };

/** Token accepted — offers a "back to login" call to action. */
export const Success: Story = { args: { status: 'success' } };

/** Token rejected but the link itself was well-formed (e.g. expired). */
export const Error: Story = { args: { status: 'error', isLinkValid: true } };

/** Malformed link — shows the "invalid link" copy instead. */
export const InvalidLink: Story = { args: { status: 'error', isLinkValid: false } };
