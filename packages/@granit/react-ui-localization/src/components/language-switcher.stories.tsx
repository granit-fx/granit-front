import { mockLanguages } from '@granit/react-localization/testing';

import { LanguagesContext } from '../languages-context';
import { LanguageSwitcher } from './language-switcher';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof LanguageSwitcher> = {
  title: 'Features/Localization/LanguageSwitcher',
  component: LanguageSwitcher,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <LanguagesContext.Provider value={mockLanguages}>
        <div className="w-48 rounded-md border p-4">
          <Story />
        </div>
      </LanguagesContext.Provider>
    ),
  ],
};

export const SingleLanguage: Story = {
  decorators: [
    (Story) => (
      <LanguagesContext.Provider value={[mockLanguages[0]]}>
        <div className="w-48 rounded-md border p-4">
          <Story />
        </div>
      </LanguagesContext.Provider>
    ),
  ],
};

export const NoLanguages: Story = {
  decorators: [
    (Story) => (
      <LanguagesContext.Provider value={[]}>
        <div className="w-48 rounded-md border p-4">
          <p className="text-muted-foreground text-xs">(component renders nothing when empty)</p>
          <Story />
        </div>
      </LanguagesContext.Provider>
    ),
  ],
};
