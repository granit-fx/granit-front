import { useState } from 'react';

import { CodeEditor } from './code-editor';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof CodeEditor> = {
  title: 'Features/Templates/CodeEditor',
  component: CodeEditor,
  tags: ['autodocs'],
  argTypes: {
    onChange: { action: 'onChange' },
    readOnly: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE = '<h1>{{ model.title }}</h1>\n<p>Amount: {{ model.amount }} EUR</p>';

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(SAMPLE);
    return <CodeEditor {...args} value={value} onChange={setValue} />;
  },
};

export const ReadOnly: Story = {
  args: {
    readOnly: true,
  },
  render: (args) => {
    const [value, setValue] = useState(SAMPLE);
    return <CodeEditor {...args} value={value} onChange={setValue} />;
  },
};
