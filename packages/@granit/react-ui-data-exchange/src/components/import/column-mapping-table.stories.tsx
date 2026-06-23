import { fn } from 'storybook/test';

import { ColumnMappingTable } from './column-mapping-table';

import type {
  ImportColumnMapping as ColumnMapping,
  ImportFieldMetadata as FieldMetadata,
} from '@granit/data-exchange';
import type { Meta, StoryObj } from '@storybook/react-vite';

const headers = ['Full name', 'E-mail', 'Country', 'Unmapped column'];

const previewRows: readonly (readonly string[])[] = [
  ['Jane Doe', 'jane@example.com', 'BE', 'x'],
  ['John Smith', 'john@example.com', 'FR', 'y'],
];

const fieldMetadata: readonly FieldMetadata[] = [
  {
    propertyPath: 'name',
    clrTypeName: 'String',
    displayName: 'Name',
    description: null,
    isRequired: true,
  },
  {
    propertyPath: 'email',
    clrTypeName: 'String',
    displayName: 'Email',
    description: null,
    isRequired: true,
  },
  {
    propertyPath: 'countryCode',
    clrTypeName: 'String',
    displayName: 'Country',
    description: 'ISO 3166-1 alpha-2',
    isRequired: false,
  },
];

const mappings: readonly ColumnMapping[] = [
  { sourceColumn: 'Full name', targetProperty: 'name', confidence: 'Exact' },
  { sourceColumn: 'E-mail', targetProperty: 'email', confidence: 'Fuzzy' },
  { sourceColumn: 'Country', targetProperty: 'countryCode', confidence: 'Semantic' },
  { sourceColumn: 'Unmapped column', targetProperty: null, confidence: 'Manual' },
];

const meta = {
  title: 'DataExchange/ColumnMappingTable',
  component: ColumnMappingTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    headers,
    previewRows,
    fieldMetadata,
    mappings,
    onMappingChange: fn(),
  },
} satisfies Meta<typeof ColumnMappingTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Source columns mapped to target properties at varying confidence levels. */
export const Default: Story = {};

/** Read-only: mapping selects are disabled (e.g. while confirming). */
export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
