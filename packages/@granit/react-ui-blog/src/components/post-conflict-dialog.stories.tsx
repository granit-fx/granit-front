import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { blogTranslationsEn } from '../locales';

import { PostConflictDialog } from './post-conflict-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const storyI18n = i18next.createInstance();
await storyI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: { ...blogTranslationsEn } } },
  interpolation: { escapeValue: false },
});

const meta: Meta<typeof PostConflictDialog> = {
  title: 'Blog/PostConflictDialog',
  component: PostConflictDialog,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <Story />
      </I18nextProvider>
    ),
  ],
  args: { onReload: () => undefined, onDismiss: () => undefined },
};

export default meta;
type Story = StoryObj<typeof PostConflictDialog>;

export const StaleStamp: Story = {
  args: { conflict: { status: 409, code: 'Granit:Blog:StalePost', detail: null } },
};

export const SlugConflict: Story = {
  args: { conflict: { status: 409, code: 'Granit:Blog:PostSlugConflict', detail: null } },
};
