import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { catalogTranslationsEn } from '../locales';

import { LifecycleStatusBadge } from './lifecycle-status-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

const storyI18n = i18next.createInstance();
void storyI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: { ...catalogTranslationsEn } } },
  interpolation: { escapeValue: false },
});

function StoryProviders({ children }: { readonly children: ReactNode }) {
  return <I18nextProvider i18n={storyI18n}>{children}</I18nextProvider>;
}

const meta: Meta<typeof LifecycleStatusBadge> = {
  title: 'Catalog/LifecycleStatusBadge',
  component: LifecycleStatusBadge,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <StoryProviders>
        <Story />
      </StoryProviders>
    ),
  ],
  argTypes: {
    status: {
      control: 'select',
      options: ['Draft', 'Published', 'Archived'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Draft: Story = { args: { status: 'Draft' } };
export const Published: Story = { args: { status: 'Published' } };
export const Archived: Story = { args: { status: 'Archived' } };

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <LifecycleStatusBadge status="Draft" />
      <LifecycleStatusBadge status="Published" />
      <LifecycleStatusBadge status="Archived" />
    </div>
  ),
};
