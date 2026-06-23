import { mockLanguages } from '@granit/react-localization/testing';

import { LanguagesContext } from '../languages-context';

import { LanguageList } from './language-list';

import type { LanguageInfo } from '@granit/localization';
import type { Meta, StoryObj } from '@storybook/react-vite';

const storyLanguages: LanguageInfo[] = [
  { cultureName: 'fr', displayName: 'Français', flagIcon: '🇫🇷', isDefault: true },
  { cultureName: 'en', displayName: 'English', flagIcon: '🇬🇧', isDefault: false },
  { cultureName: 'nl', displayName: 'Nederlands', flagIcon: '🇳🇱', isDefault: false },
];

const meta: Meta<typeof LanguageList> = {
  title: 'Features/Localization/LanguageList',
  component: LanguageList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof LanguageList>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <LanguagesContext.Provider value={storyLanguages}>
        <Story />
      </LanguagesContext.Provider>
    ),
  ],
};

export const FromTestingFixture: Story = {
  decorators: [
    (Story) => (
      <LanguagesContext.Provider value={mockLanguages}>
        <Story />
      </LanguagesContext.Provider>
    ),
  ],
};

export const Empty: Story = {
  decorators: [
    (Story) => (
      <LanguagesContext.Provider value={[]}>
        <Story />
      </LanguagesContext.Provider>
    ),
  ],
};
