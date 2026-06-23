import { fn } from 'storybook/test';

import { ImportReportSummary } from './import-report-summary';

import type { ImportReportResponse } from '@granit/data-exchange';
import type { Meta, StoryObj } from '@storybook/react-vite';

const completedReport: ImportReportResponse = {
  finalStatus: 'Completed',
  duration: '00:00:04.231',
  totalRows: 150,
  succeededRows: 150,
  failedRows: 0,
  skippedRows: 0,
  insertedRows: 120,
  updatedRows: 30,
};

const partialReport: ImportReportResponse = {
  finalStatus: 'PartiallyCompleted',
  duration: '00:00:06.812',
  totalRows: 200,
  succeededRows: 175,
  failedRows: 25,
  skippedRows: 0,
  insertedRows: 140,
  updatedRows: 35,
};

const failedReport: ImportReportResponse = {
  finalStatus: 'Failed',
  duration: '00:00:01.045',
  totalRows: 50,
  succeededRows: 0,
  failedRows: 50,
  skippedRows: 0,
  insertedRows: 0,
  updatedRows: 0,
};

const meta = {
  title: 'DataExchange/ImportReportSummary',
  component: ImportReportSummary,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ImportReportSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    report: completedReport,
  },
};

export const PartiallyCompleted: Story = {
  args: {
    report: partialReport,
    onDownloadCorrection: fn(),
  },
};

export const WithErrors: Story = {
  args: {
    report: partialReport,
    onDownloadCorrection: fn(),
  },
};

export const Failed: Story = {
  args: {
    report: failedReport,
    onDownloadCorrection: fn(),
  },
};

export const FailedNoDownload: Story = {
  args: {
    report: failedReport,
  },
};
