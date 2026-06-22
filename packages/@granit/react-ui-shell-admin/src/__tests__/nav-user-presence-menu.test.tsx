import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@granit/react-ui';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeT } from './test-utils';

import type { ReactElement } from 'react';

vi.mock('@granit/react-localization', () => ({ useTranslation: () => ({ t: makeT() }) }));

vi.mock('@granit/react-presence', () => ({
  PresenceDot: ({ status }: { status: string }) => <span data-slot="dot">{status}</span>,
  useMyPresence: () => ({ data: presenceData }),
  useSetMyPresence: () => ({ mutate: setMutate }),
  useClearMyPresenceOverride: () => ({ mutate: clearMutate }),
}));

const setMutate = vi.fn();
const clearMutate = vi.fn();
let presenceData: { effectiveStatus: string; manualOverride: string | null } | undefined;

const { NavUserPresenceMenu } = await import('../nav-user-presence-menu');

function renderOpen(ui: ReactElement) {
  return {
    ...render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>menu</DropdownMenuTrigger>
        <DropdownMenuContent>{ui}</DropdownMenuContent>
      </DropdownMenu>
    ),
    user: userEvent.setup(),
  };
}

beforeEach(() => {
  setMutate.mockClear();
  clearMutate.mockClear();
  presenceData = undefined;
});

describe('NavUserPresenceMenu', () => {
  it('renders the trigger with the effective status label (defaults to Offline)', () => {
    presenceData = undefined;
    renderOpen(<NavUserPresenceMenu />);
    // triggerLabel = t('Status.Offline') -> last-segment fallback "Offline".
    expect(screen.getByText('Status.Offline')).toBeInTheDocument();
  });

  it('reflects an Online effective status on the trigger', () => {
    presenceData = { effectiveStatus: 'Online', manualOverride: null };
    renderOpen(<NavUserPresenceMenu />);
    expect(screen.getByText('Status.Online')).toBeInTheDocument();
  });

  it('opens the status submenu rendering every manual status option', async () => {
    presenceData = { effectiveStatus: 'Online', manualOverride: null };
    const { user } = renderOpen(<NavUserPresenceMenu />);
    await user.click(screen.getByText('Status.Online'));
    // Each STATUS_OPTIONS entry is rendered (covers the option map +
    // manualToEffective for Available/Busy/DoNotDisturb/AppearOffline).
    expect(await screen.findByText('Manual.Available')).toBeInTheDocument();
    expect(screen.getByText('Manual.Busy')).toBeInTheDocument();
    expect(screen.getByText('Manual.DoNotDisturb')).toBeInTheDocument();
    // AppearOffline shows as "Offline" (Status.Offline key, last segment).
    expect(screen.getByText('Status.Offline')).toBeInTheDocument();
    // No active override -> none of the options is flagged active.
    expect(document.querySelector('[role="menuitem"][data-active="true"]')).toBeNull();
  });

  it('flags the active override and enables the Until/Clear actions when an override exists', async () => {
    presenceData = { effectiveStatus: 'Busy', manualOverride: 'Busy' };
    const { user } = renderOpen(<NavUserPresenceMenu />);
    await user.click(screen.getAllByText('Status.Busy')[0]);
    // The matching option carries data-active (hasOverride branch).
    expect(await screen.findByText('Picker.Clear')).toBeInTheDocument();
    expect(document.querySelector('[role="menuitem"][data-active="true"]')).not.toBeNull();
    // The "Until" duration sub-trigger is enabled (not aria-disabled).
    const until = screen.getByText('Picker.Until').closest('[role="menuitem"]');
    expect(until).not.toHaveAttribute('aria-disabled', 'true');
  });
});
