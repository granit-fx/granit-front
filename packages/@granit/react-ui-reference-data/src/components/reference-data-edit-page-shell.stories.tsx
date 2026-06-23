import { toEntityId } from '@granit/types';
import { MemoryRouter } from 'react-router-dom';
import { fn } from 'storybook/test';

import { ReferenceDataEditPageShell } from './reference-data-edit-page-shell';

import type { ReferenceDataEntry } from './types';
import type { Meta, StoryObj } from '@storybook/react-vite';

const entry: ReferenceDataEntry = {
  id: toEntityId('rd-001'),
  code: 'FR',
  label: 'France',
  labelEn: 'France',
  labelFr: 'France',
  labelNl: 'Frankrijk',
  labelDe: 'Frankreich',
  labelEs: 'Francia',
  labelIt: 'Francia',
  labelPt: 'França',
  labelZh: '法国',
  labelJa: 'フランス',
  labelPl: 'Francja',
  labelTr: 'Fransa',
  labelKo: '프랑스',
  labelSv: 'Frankrike',
  labelCs: 'Francie',
  activated: true,
  sortOrder: 10,
  validFrom: null,
  validTo: null,
  parentCode: null,
  metadata: null,
};

const meta: Meta<typeof ReferenceDataEditPageShell> = {
  title: 'Features/ReferenceData/ReferenceDataEditPageShell',
  component: ReferenceDataEditPageShell,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    i18nPrefix: 'Countries',
    basePath: '/countries',
    entry,
    isLoading: false,
    error: null,
    onDeactivate: fn(),
    onReactivate: fn(),
    children: (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        Form slot
      </div>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof ReferenceDataEditPageShell>;

export const Active: Story = {};

export const Inactive: Story = {
  args: { entry: { ...entry, activated: false } },
};

export const Loading: Story = {
  args: { isLoading: true },
};

export const NotFound: Story = {
  args: { entry: undefined, error: new Error('Not found') },
};
