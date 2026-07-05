import { mockEntityManifest } from '@granit/react-entities/testing';
import { fn } from 'storybook/test';

import { UrlFormComponent } from './url-form-component';

import type { EntityFormFieldManifest } from '@granit/entities';
import type { Meta, StoryObj } from '@storybook/react-vite';

const baseField = mockEntityManifest.forms![0]!.sections[0]!.fields[0]!;

function field(overrides: Partial<EntityFormFieldManifest> = {}): EntityFormFieldManifest {
  return { ...baseField, propertyName: 'Website', component: 'url', ...overrides };
}

const meta = {
  title: 'Entities/UrlFormComponent',
  component: UrlFormComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Entity form field wrapper for URL values. Delegates to the `UrlInput` primitive (a protocol dropdown + host input) and stores a single `scheme://rest` string. Non-string values collapse to `null`; an emitted empty value is coerced back to `null`.',
      },
    },
  },
  args: {
    onChange: fn(),
    readOnly: false,
  },
} satisfies Meta<typeof UrlFormComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Populated https value — the protocol dropdown detects `https` and the host fills the input. */
export const Populated: Story = {
  args: {
    field: field(),
    value: 'https://example.com',
  },
};

/** An http value — the dropdown reflects the non-default scheme parsed from the string. */
export const HttpProtocol: Story = {
  args: {
    field: field(),
    value: 'http://legacy.internal', // NOSONAR S5332: story fixture demonstrating how the input parses a non-default (non-https) scheme; not a live endpoint
  },
};

/** Empty value — a non-string collapses to `null` and the input renders blank. */
export const Empty: Story = {
  args: {
    field: field(),
    value: null,
  },
};

/** Read-only rendering — the protocol dropdown and host input are both disabled. */
export const ReadOnly: Story = {
  args: {
    field: field(),
    value: 'https://example.com',
    readOnly: true,
  },
};
