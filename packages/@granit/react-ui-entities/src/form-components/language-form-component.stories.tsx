import { mockEntityManifest } from '@granit/react-entities/testing';
import { mockLanguages } from '@granit/react-localization/testing';
import { LanguagesContext } from '@granit/react-ui-localization';
import { fn } from 'storybook/test';

import { LanguageFormComponent } from './language-form-component';

import type { EntityFormFieldManifest } from '@granit/entities';
import type { Meta, StoryObj } from '@storybook/react-vite';

const baseField = mockEntityManifest.forms![0]!.sections[0]!.fields[0]!;

function field(overrides: Partial<EntityFormFieldManifest> = {}): EntityFormFieldManifest {
  return { ...baseField, propertyName: 'Culture', component: 'language', ...overrides };
}

const meta = {
  title: 'Entities/LanguageFormComponent',
  component: LanguageFormComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Entity-form field renderer for the `language` component. Binds a culture-name string to a `<Select>` populated from `useLanguages()` (the host-provided `LanguagesContext`).',
      },
    },
  },
  args: {
    field: field(),
    readOnly: false,
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <LanguagesContext.Provider value={mockLanguages}>
        <div className="w-64">
          <Story />
        </div>
      </LanguagesContext.Provider>
    ),
  ],
} satisfies Meta<typeof LanguageFormComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A culture already selected — the Select reflects the bound value. */
export const Populated: Story = {
  args: {
    value: 'fr',
  },
};

/** No selection yet — the placeholder is shown. */
export const Empty: Story = {
  args: {
    value: '',
  },
};

/** Read-only binding — the Select is disabled and cannot be changed. */
export const ReadOnly: Story = {
  args: {
    value: 'fr',
    readOnly: true,
  },
};

/** A single available language — only one option is offered. */
export const SingleLanguage: Story = {
  args: {
    value: 'en',
  },
  decorators: [
    (Story) => (
      <LanguagesContext.Provider value={[mockLanguages[0]!]}>
        <div className="w-64">
          <Story />
        </div>
      </LanguagesContext.Provider>
    ),
  ],
};
