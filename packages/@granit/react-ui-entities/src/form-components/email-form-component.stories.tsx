import { mockEntityManifest } from '@granit/react-entities/testing';
import { fn } from 'storybook/test';

import { EmailFormComponent } from './email-form-component';

import type { EntityFormFieldManifest } from '@granit/entities';
import type { Meta, StoryObj } from '@storybook/react-vite';

const baseField = mockEntityManifest.forms![0]!.sections[0]!.fields[0]!;

function field(overrides: Partial<EntityFormFieldManifest> = {}): EntityFormFieldManifest {
  return { ...baseField, propertyName: 'Email', component: 'email', ...overrides };
}

const meta = {
  title: 'Entities/EmailFormComponent',
  component: EmailFormComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Entity-form field renderer for the `email` component. A controlled `type="email"` input with a leading mail icon; emits `null` when cleared and reflects `aria-invalid` when an error message is present.',
      },
    },
  },
  args: {
    field: field(),
    readOnly: false,
    onChange: fn(),
  },
} satisfies Meta<typeof EmailFormComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A bound email address. */
export const Populated: Story = {
  args: {
    value: 'jane.doe@example.com',
  },
};

/** No value yet — the input renders empty. */
export const Empty: Story = {
  args: {
    value: '',
  },
};

/** Read-only rendering of a bound value. */
export const ReadOnly: Story = {
  args: {
    value: 'jane.doe@example.com',
    readOnly: true,
  },
};

/** Validation error — the input is marked `aria-invalid`. */
export const WithError: Story = {
  args: {
    value: 'not-an-email',
    errorMessage: 'Enter a valid email address.',
  },
};
