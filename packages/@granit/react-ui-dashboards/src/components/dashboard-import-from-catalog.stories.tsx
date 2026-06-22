import { fn } from 'storybook/test';

import { DashboardImportFromCatalog } from './dashboard-import-from-catalog';

import type { DashboardCatalogEntryResponse } from '@granit/dashboards';
import type { Meta, StoryObj } from '@storybook/react-vite';

const sampleCatalog: readonly DashboardCatalogEntryResponse[] = [
  {
    name: 'Granit.Invoicing.FinanceOverview',
    category: 'Finance',
    isSystem: true,
    version: '1.2.0',
    widgetCount: 6,
    hasViews: true,
    hasAliases: false,
    hasFilters: true,
  },
  {
    name: 'Granit.Operations.FleetStatus',
    category: 'Operations',
    isSystem: false,
    version: '2.0.1',
    widgetCount: 4,
    hasViews: false,
    hasAliases: true,
    hasFilters: false,
  },
];

const meta: Meta<typeof DashboardImportFromCatalog> = {
  title: 'Dashboards/DashboardImportFromCatalog',
  component: DashboardImportFromCatalog,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onCategoryChange: { action: 'onCategoryChange' },
    onImport: { action: 'onImport' },
  },
};

export default meta;
type Story = StoryObj<typeof DashboardImportFromCatalog>;

export const Default: Story = {
  args: {
    catalog: sampleCatalog,
    disabled: false,
    category: undefined,
    onCategoryChange: fn(),
    onImport: fn(),
  },
};

export const FilteredByCategory: Story = {
  args: {
    catalog: [sampleCatalog[0]],
    disabled: false,
    category: 'Finance',
    onCategoryChange: fn(),
    onImport: fn(),
  },
};

export const EmptyCatalog: Story = {
  args: {
    catalog: [],
    disabled: false,
    category: undefined,
    onCategoryChange: fn(),
    onImport: fn(),
  },
};

export const Disabled: Story = {
  args: {
    catalog: sampleCatalog,
    disabled: true,
    category: undefined,
    onCategoryChange: fn(),
    onImport: fn(),
  },
};
