import { mockEntityManifest } from '@granit/react-entities/testing';
import { fn } from 'storybook/test';

import { PhoneFormComponent } from './phone-form-component';

import type { EntityFormFieldManifest } from '@granit/entities';
import type { Meta, StoryObj } from '@storybook/react-vite';

const baseField = mockEntityManifest.forms![0]!.sections[0]!.fields[0]!;

function field(overrides: Partial<EntityFormFieldManifest> = {}): EntityFormFieldManifest {
  return { ...baseField, propertyName: 'Phone', component: 'phone', ...overrides };
}

const meta = {
  title: 'Entities/PhoneFormComponent',
  component: PhoneFormComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Entity form field wrapper for phone numbers. Delegates to `PhoneInput` (country selector + national input) and stores the value as an E.164 string; non-string values collapse to `null`, and `readOnly` disables the control.',
      },
    },
  },
  args: {
    onChange: fn(),
    readOnly: false,
  },
} satisfies Meta<typeof PhoneFormComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Populated E.164 value — country inferred (BE) and the national part rendered. */
export const Populated: Story = {
  args: {
    field: field(),
    value: '+3212345',
  },
};

/** Empty value — the input falls back to the default country with a blank national part. */
export const Empty: Story = {
  args: {
    field: field(),
    value: null,
  },
};

/** Read-only rendering of a populated value — both the country trigger and input are disabled. */
export const ReadOnly: Story = {
  args: {
    field: field(),
    value: '+3212345',
    readOnly: true,
  },
};
