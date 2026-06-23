import { DevicesCard, type DevicesCardLabels } from './devices-card';

import type { UserDeviceResponse } from '@granit/identity';
import type { Meta, StoryObj } from '@storybook/react-vite';

const labels: DevicesCardLabels = {
  title: 'My devices',
  empty: 'No device activity',
  lastActivity: 'Last activity',
  sessionCount: (count) => `${count} session${count === 1 ? '' : 's'}`,
};

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();
const id = (value: string) => value as UserDeviceResponse['deviceId'];

const devices: UserDeviceResponse[] = [
  {
    deviceId: id('dev-1'),
    kind: 'Browser',
    operatingSystem: 'Windows',
    browser: 'Chrome',
    lastSeen: minutesAgo(2) as UserDeviceResponse['lastSeen'],
    sessionCount: 2,
    lastLocation: {
      city: 'Brussels',
      region: 'Brussels-Capital',
      country: 'Belgium',
      countryCode: 'BE',
      latitude: null,
      longitude: null,
    },
  },
  {
    deviceId: id('dev-2'),
    kind: 'MobileApp',
    operatingSystem: 'iOS',
    browser: null,
    lastSeen: minutesAgo(180) as UserDeviceResponse['lastSeen'],
    sessionCount: 1,
    lastLocation: null,
  },
];

const meta = {
  title: 'Identity/DevicesCard',
  component: DevicesCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { labels },
} satisfies Meta<typeof DevicesCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { devices, isLoading: false },
};

export const Loading: Story = {
  args: { devices: undefined, isLoading: true },
};

export const Empty: Story = {
  args: { devices: [], isLoading: false },
};
