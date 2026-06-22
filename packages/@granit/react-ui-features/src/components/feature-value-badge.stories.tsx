import { FeatureValueBadge } from './feature-value-badge';

import type { FeatureDefinitionResponse } from '@granit/features';
import type { Meta, StoryObj } from '@storybook/react-vite';

const toggleDefinition: FeatureDefinitionResponse = {
  name: 'beta-dashboard',
  defaultValue: 'false',
  valueType: 'Toggle',
  numericConstraint: null,
  selectionValues: null,
  displayName: 'Beta dashboard',
  description: 'Enables the redesigned analytics dashboard.',
};

const selectionDefinition: FeatureDefinitionResponse = {
  name: 'invoice-theme',
  defaultValue: 'classic',
  valueType: 'Selection',
  numericConstraint: null,
  selectionValues: ['classic', 'modern', 'minimal'],
  displayName: 'Invoice theme',
  description: 'Visual theme applied to generated invoices.',
};

const numericDefinition: FeatureDefinitionResponse = {
  name: 'max-api-keys',
  defaultValue: '5',
  valueType: 'Numeric',
  numericConstraint: { min: 1, max: 50 },
  selectionValues: null,
  displayName: 'Max API keys',
  description: 'Maximum number of API keys per workspace.',
};

const meta: Meta<typeof FeatureValueBadge> = {
  title: 'Features/FeatureValueBadge',
  component: FeatureValueBadge,
  tags: ['autodocs'],
  argTypes: {
    definition: {
      control: 'object',
    },
    value: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ToggleEnabled: Story = {
  args: { definition: toggleDefinition, value: 'true' },
};
export const ToggleDisabled: Story = {
  args: { definition: toggleDefinition, value: 'false' },
};
export const Selection: Story = {
  args: { definition: selectionDefinition, value: 'modern' },
};
export const Numeric: Story = {
  args: { definition: numericDefinition, value: '25' },
};

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <FeatureValueBadge definition={toggleDefinition} value="true" />
      <FeatureValueBadge definition={toggleDefinition} value="false" />
      <FeatureValueBadge definition={selectionDefinition} value="modern" />
      <FeatureValueBadge definition={numericDefinition} value="25" />
    </div>
  ),
};
