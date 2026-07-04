import { mockEntityManifest } from '@granit/react-entities/testing';
import { fn } from 'storybook/test';

import { MoneyFormComponent } from './money-form-component';

import type { EntityFormFieldManifest } from '@granit/entities';
import type { Meta, StoryObj } from '@storybook/react-vite';

const baseField = mockEntityManifest.forms![0]!.sections[0]!.fields[0]!;

function field(overrides: Partial<EntityFormFieldManifest> = {}): EntityFormFieldManifest {
  return {
    ...baseField,
    propertyName: 'Amount',
    component: 'currency',
    config: null,
    ...overrides,
  };
}

const meta = {
  title: 'Entities/MoneyFormComponent',
  component: MoneyFormComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Entity form field wrapper for money values. Amounts stay on the wire as Int64 minor units (cents); the input renders and accepts decimal major units, round-tripping through 100×. An optional currency hint is read from `field.config.currencyCode` (or `currencyProperty`).',
      },
    },
  },
  args: {
    onChange: fn(),
    readOnly: false,
  },
} satisfies Meta<typeof MoneyFormComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Populated value (1234 minor units → "12.34") with a EUR currency hint. */
export const Populated: Story = {
  args: {
    field: field({ config: { currencyCode: 'EUR' } }),
    value: 1234,
  },
};

/** Empty value — non-number collapses to a blank input and the hint is omitted. */
export const Empty: Story = {
  args: {
    field: field(),
    value: null,
  },
};

/** Read-only rendering of a populated value. */
export const ReadOnly: Story = {
  args: {
    field: field({ config: { currencyCode: 'USD' } }),
    value: 5000,
    readOnly: true,
  },
};

/** Invalid state — an error message marks the input `aria-invalid`. */
export const WithError: Story = {
  args: {
    field: field({ config: { currencyCode: 'EUR' } }),
    value: 100,
    errorMessage: 'Required',
  },
};
