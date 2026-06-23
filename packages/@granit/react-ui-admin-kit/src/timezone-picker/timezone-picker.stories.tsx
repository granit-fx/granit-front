import { useState } from 'react';
import { fn } from 'storybook/test';

import { TimezonePicker } from './timezone-picker';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

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

type TimezonePickerArgs = ComponentProps<typeof TimezonePicker>;

function ControlledTimezonePicker({
  initialValue = null,
  ...args
}: TimezonePickerArgs & { initialValue?: string | null }) {
  const [value, setValue] = useState<string | null>(initialValue);
  return (
    <div className="w-80">
      <TimezonePicker
        {...args}
        value={value}
        onChange={(v) => {
          setValue(v);
          args.onChange?.(v);
        }}
      />
    </div>
  );
}

export const Default: Story = {
  render: (args) => <ControlledTimezonePicker {...args} />,
};

export const WithPreselectedValue: Story = {
  render: (args) => <ControlledTimezonePicker {...args} initialValue="Europe/Brussels" />,
};

export const NonClearable: Story = {
  render: (args) => (
    <ControlledTimezonePicker {...args} initialValue="America/New_York" clearable={false} />
  ),
};

export const Disabled: Story = {
  render: (args) => (
    <div className="w-80">
      <TimezonePicker {...args} value="Asia/Tokyo" disabled />
    </div>
  ),
};
