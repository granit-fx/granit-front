import { SessionsCard, type SessionsCardLabels } from './sessions-card';

import type { UserSessionId, UserSessionResponse } from '@granit/identity';
import type { Meta, StoryObj } from '@storybook/react-vite';

const labels: SessionsCardLabels = {
  title: 'My Sessions',
  empty: 'No active sessions',
  current: 'Current',
  createdAt: 'Created',
  lastAccess: 'Last activity',
  unknownDevice: 'Unknown device',
  ipAddress: 'IP address',
  active: 'Active',
  inactive: 'Inactive',
  revoke: 'Revoke',
  revokeAll: 'Revoke all others',
};

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();
const id = (value: string) => value as UserSessionId;

const sessions: UserSessionResponse[] = [
  {
    sessionId: id('sess-1'),
    isCurrent: true,
    createdAt: minutesAgo(180) as UserSessionResponse['createdAt'],
    lastAccessedAt: minutesAgo(1) as UserSessionResponse['lastAccessedAt'],
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    ipAddress: '203.0.113.0',
    location: {
      city: 'Brussels',
      region: 'Brussels-Capital',
      country: 'Belgium',
      countryCode: 'BE',
      latitude: null,
      longitude: null,
    },
    riskLevel: null,
    riskReasons: null,
  },
  {
    sessionId: id('sess-2'),
    isCurrent: false,
    createdAt: minutesAgo(2880) as UserSessionResponse['createdAt'],
    lastAccessedAt: minutesAgo(4) as UserSessionResponse['lastAccessedAt'],
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    ipAddress: '198.51.100.0',
    location: null,
    riskLevel: 'Low',
    riskReasons: ['new_location'],
  },
  {
    sessionId: id('sess-3'),
    isCurrent: false,
    createdAt: minutesAgo(20160) as UserSessionResponse['createdAt'],
    lastAccessedAt: minutesAgo(4320) as UserSessionResponse['lastAccessedAt'],
    userAgent: 'curl/8.4.0',
    ipAddress: '192.0.2.0',
    location: null,
    riskLevel: 'High',
    riskReasons: ['impossible_travel', 'new_country'],
  },
];

const meta = {
  title: 'Identity/SessionsCard',
  component: SessionsCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    labels,
    onRevoke: () => {},
    onRevokeAll: () => {},
  },
} satisfies Meta<typeof SessionsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Mixed list: a recently-active current session, a stale phone, and an unknown client. */
export const Default: Story = {
  args: { sessions, isLoading: false },
};

export const Loading: Story = {
  args: { sessions: undefined, isLoading: true },
};

export const Empty: Story = {
  args: { sessions: [], isLoading: false },
};
