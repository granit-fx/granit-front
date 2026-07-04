import { mockEntityManifest } from '@granit/react-entities/testing';
import { fn } from 'storybook/test';

import { TimezoneFormComponent } from './timezone-form-component';

import type { EntityFormFieldManifest } from '@granit/entities';
import type { Meta, StoryObj } from '@storybook/react-vite';

const baseField = mockEntityManifest.forms![0]!.sections[0]!.fields[0]!;

function field(overrides: Partial<EntityFormFieldManifest> = {}): EntityFormFieldManifest {
  return { ...baseField, propertyName: 'Timezone', component: 'timezone', ...overrides };
}

const meta = {
  title: 'Entities/TimezoneFormComponent',
  component: TimezoneFormComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'EntityForm field wrapper around `TimezonePicker`. Forwards the field id/name, coerces a non-string value to `null`, marks the picker clearable and disables it in read-only mode.',
      },
    },
  },
  args: {
    field: field(),
    onChange: fn(),
    readOnly: false,
  },
} satisfies Meta<typeof TimezoneFormComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A populated IANA timezone value is forwarded straight to the picker. */
export const Populated: Story = {
  args: {
    value: 'Europe/Brussels',
  },
};

/** No value — the picker shows its placeholder (and self-defaults to the user zone). */
export const Empty: Story = {
  args: {
    value: null,
  },
};

/** Read-only — the picker is rendered disabled. */
export const ReadOnly: Story = {
  args: {
    value: 'Asia/Tokyo',
    readOnly: true,
  },
};
