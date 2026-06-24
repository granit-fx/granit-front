import { fn } from 'storybook/test';

import { TablePagination } from './table-pagination';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Admin Kit/TablePagination',
  component: TablePagination,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    onPageChange: fn(),
    onPageSizeChange: fn(),
  },
} satisfies Meta<typeof TablePagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    page: 3,
    pageSize: 20,
    totalCount: 243,
  },
};

export const FirstPage: Story = {
  args: {
    page: 1,
    pageSize: 20,
    totalCount: 243,
  },
};

export const LastPage: Story = {
  args: {
    page: 13,
    pageSize: 20,
    totalCount: 243,
  },
};

export const SinglePage: Story = {
  args: {
    page: 1,
    pageSize: 20,
    totalCount: 5,
  },
};

export const CustomPageSizes: Story = {
  args: {
    page: 2,
    pageSize: 25,
    totalCount: 300,
    pageSizeOptions: [25, 50, 75, 100],
  },
};

export const LargeDataset: Story = {
  args: {
    page: 50,
    pageSize: 10,
    totalCount: 10000,
  },
};
