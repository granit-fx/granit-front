import { toISODateString } from '@granit/types';
import { fn } from 'storybook/test';

import { BlobDeleteDialog } from './blob-delete-dialog';

import type { BlobDescriptorListItem } from '@granit/blob-storage';
import type { Meta, StoryObj } from '@storybook/react-vite';

const sampleBlob: BlobDescriptorListItem = {
  id: '9a1b2c3d-0001-4000-a000-000000000001',
  tenantId: null,
  containerName: 'patient-documents',
  objectKey: 'patient-documents/rapport-analyse-2026-03.pdf',
  originalFileName: 'rapport-analyse-2026-03.pdf',
  declaredContentType: 'application/pdf',
  maxAllowedBytes: 10_485_760,
  verifiedContentType: 'application/pdf',
  sizeBytes: 1_245_184,
  status: 'Valid',
  rejectionReason: null,
  deletionReason: null,
  createdAt: toISODateString('2026-03-01T08:12:00Z'),
  createdBy: 'user-1',
  validatedAt: toISODateString('2026-03-01T08:12:05Z'),
  deletedAt: null,
};

const meta: Meta<typeof BlobDeleteDialog> = {
  title: 'Features/BlobStorage/BlobDeleteDialog',
  component: BlobDeleteDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    blob: sampleBlob,
    open: true,
    isPending: false,
    onOpenChange: fn(),
    onConfirm: fn(),
  },
  argTypes: {
    open: { control: 'boolean' },
    isPending: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Confirmation dialog with an optional deletion-reason field. */
export const Default: Story = {};

/** While the deletion is in flight the actions are disabled. */
export const Pending: Story = {
  args: { isPending: true },
};
