import { TooltipProvider } from '@granit/react-ui';

import { SessionRiskIndicator } from './session-risk-indicator';

import type { RiskLabelStrings } from './use-risk-label-strings';
import type { Meta, StoryObj } from '@storybook/react-vite';

const LEVELS: Record<string, string> = { Low: 'Low', Medium: 'Medium', High: 'High' };
const REASONS: Record<string, string> = {
  new_location: 'New location',
  new_device: 'New device',
  impossible_travel: 'Impossible travel',
};

const labels: RiskLabelStrings = {
  title: 'Elevated risk',
  level: (level) => LEVELS[level] ?? level,
  reason: (code) => REASONS[code] ?? code,
};

const meta = {
  title: 'Identity/SessionRiskIndicator',
  component: SessionRiskIndicator,
  tags: ['autodocs'],
  args: { labels },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof SessionRiskIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Low: Story = {
  args: { level: 'Low', reasons: ['new_location'] },
};

export const Medium: Story = {
  args: { level: 'Medium', reasons: ['new_location', 'new_device'] },
};

export const High: Story = {
  args: { level: 'High', reasons: ['impossible_travel', 'new_device'] },
};

/** `None`/null renders nothing — the row simply has no risk icon. */
export const None: Story = {
  args: { level: 'None', reasons: null },
};
