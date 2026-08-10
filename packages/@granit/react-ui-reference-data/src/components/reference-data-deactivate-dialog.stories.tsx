import { toEntityId } from '@granit/types';
import { fn } from 'storybook/test';

import { ReferenceDataDeactivateDialog } from './reference-data-deactivate-dialog';

import type { ReferenceDataResponse } from './types';
import type { Meta, StoryObj } from '@storybook/react-vite';

const entry: ReferenceDataResponse = {
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
  metadata: null,
};

const meta: Meta<typeof ReferenceDataDeactivateDialog> = {
  title: 'Features/ReferenceData/ReferenceDataDeactivateDialog',
  component: ReferenceDataDeactivateDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    entry,
    open: true,
    onOpenChange: fn(),
    onConfirm: fn(),
    i18nPrefix: 'Countries',
  },
};

export default meta;
type Story = StoryObj<typeof ReferenceDataDeactivateDialog>;

export const Deactivate: Story = {
  args: { action: 'deactivate' },
};

export const Reactivate: Story = {
  args: { action: 'reactivate', entry: { ...entry, activated: false } },
};

export const Pending: Story = {
  args: { action: 'deactivate', isPending: true },
};
