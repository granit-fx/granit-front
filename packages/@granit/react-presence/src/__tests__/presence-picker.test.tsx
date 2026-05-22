import { createMockClient } from '@granit/react-testing';
import { toEntityId, toISODateString } from '@granit/types';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PresencePicker } from '../components/presence-picker.js';

import { createPresenceTestHarness } from './test-utils.js';

import type { PresenceResponse, SetPresenceRequest } from '@granit/presence';
import type { UserId } from '@granit/types';

vi.mock('@granit/presence', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getMyPresence: vi.fn(),
    setMyPresence: vi.fn(),
    clearMyPresenceOverride: vi.fn(),
  };
});

const { getMyPresence, setMyPresence, clearMyPresenceOverride } = await import('@granit/presence');

const userId = toEntityId<'User'>('user-1') as UserId;

const baseSnapshot: PresenceResponse = {
  userId,
  effectiveStatus: 'Online',
  manualOverride: null,
  overrideUntilUtc: null,
  lastSeenUtc: toISODateString('2026-05-22T10:00:00Z'),
};

beforeEach(() => {
  vi.mocked(getMyPresence).mockResolvedValue(baseSnapshot);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('PresencePicker', () => {
  it('submits the selected status with the 1h preset by default', async () => {
    const client = createMockClient();
    const dnd: PresenceResponse = {
      ...baseSnapshot,
      effectiveStatus: 'DoNotDisturb',
      manualOverride: 'DoNotDisturb',
      overrideUntilUtc: toISODateString('2026-05-22T11:00:00Z'),
    };
    vi.mocked(setMyPresence).mockResolvedValue(dnd);
    const { wrapper } = createPresenceTestHarness(client);

    render(<PresencePicker />, { wrapper });

    await userEvent.click(await screen.findByRole('radio', { name: /do not disturb/i }));
    await userEvent.click(screen.getByRole('button', { name: /set status/i }));

    await waitFor(() => expect(setMyPresence).toHaveBeenCalledOnce());
    const body = vi.mocked(setMyPresence).mock.calls[0]![2] as SetPresenceRequest;
    expect(body.manualStatus).toBe('DoNotDisturb');
    expect(body.untilUtc).not.toBeNull();
  });

  it('clears the override via the dedicated button', async () => {
    const client = createMockClient();
    vi.mocked(getMyPresence).mockResolvedValue({
      ...baseSnapshot,
      effectiveStatus: 'Busy',
      manualOverride: 'Busy',
      overrideUntilUtc: toISODateString('2026-05-22T11:00:00Z'),
    });
    vi.mocked(clearMyPresenceOverride).mockResolvedValue(baseSnapshot);
    const { wrapper } = createPresenceTestHarness(client);

    render(<PresencePicker />, { wrapper });

    const clearBtn = await screen.findByRole('button', { name: /clear status/i });
    await userEvent.click(clearBtn);
    await waitFor(() => expect(clearMyPresenceOverride).toHaveBeenCalledOnce());
  });

  it('shows the validation message when the custom until is empty', async () => {
    const client = createMockClient();
    const { wrapper } = createPresenceTestHarness(client);
    render(<PresencePicker />, { wrapper });

    await userEvent.click(await screen.findByRole('radio', { name: /^busy$/i }));
    await userEvent.click(screen.getByRole('radio', { name: /custom/i }));

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByRole('button', { name: /set status/i })).toBeDisabled();
  });
});
