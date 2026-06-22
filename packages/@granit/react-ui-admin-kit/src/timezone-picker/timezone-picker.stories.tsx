import { useState } from 'react';
import { fn } from 'storybook/test';

import { TimezonePicker } from './timezone-picker';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof TimezonePicker> = {
  title: 'Admin Kit/TimezonePicker',
  component: TimezonePicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    onChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof TimezonePicker>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<string | null>(null);
    return (
      <div className="w-80">
        <TimezonePicker
          {...args}
          value={value}
          onChange={(v) => {
            setValue(v);
            args.onChange(v);
          }}
        />
      </div>
    );
  },
};

export const WithPreselectedValue: Story = {
  render: (args) => {
    const [value, setValue] = useState<string | null>('Europe/Brussels');
    return (
      <div className="w-80">
        <TimezonePicker
          {...args}
          value={value}
          onChange={(v) => {
            setValue(v);
            args.onChange(v);
          }}
        />
      </div>
    );
  },
};

export const NonClearable: Story = {
  render: (args) => {
    const [value, setValue] = useState<string | null>('America/New_York');
    return (
      <div className="w-80">
        <TimezonePicker
          {...args}
          value={value}
          clearable={false}
          onChange={(v) => {
            setValue(v);
            args.onChange(v);
          }}
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  render: (args) => (
    <div className="w-80">
      <TimezonePicker {...args} value="Asia/Tokyo" disabled />
    </div>
  ),
};
