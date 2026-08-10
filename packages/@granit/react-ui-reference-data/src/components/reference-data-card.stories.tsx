import { toEntityId } from '@granit/types';
import { fn } from 'storybook/test';

import { ReferenceDataCard } from './reference-data-card';

import type { ReferenceDataResponse } from './types';
import type { Meta, StoryObj } from '@storybook/react-vite';

const baseEntry: ReferenceDataResponse = {
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
  labelHi: 'Francie',
  activated: true,
  sortOrder: 10,
  validFrom: null,
  validTo: null,
  parentCode: null,
  metadata: { region: 'EU', iso3: 'FRA' },
};

const meta: Meta<typeof ReferenceDataCard> = {
  title: 'Features/ReferenceData/ReferenceDataCard',
  component: ReferenceDataCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  args: {
    onEdit: fn(),
    onDeactivate: fn(),
    onReactivate: fn(),
    i18nPrefix: 'Countries',
  },
};

export default meta;
type Story = StoryObj<typeof ReferenceDataCard>;

export const Active: Story = {
  args: { entry: baseEntry },
};

export const Inactive: Story = {
  args: { entry: { ...baseEntry, activated: false } },
};

export const WithoutMetadata: Story = {
  args: { entry: { ...baseEntry, metadata: null } },
};
