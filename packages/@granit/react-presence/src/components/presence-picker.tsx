import { PRESENCE_DEFAULTS } from '@granit/presence';
import { useEffect, useMemo, useState } from 'react';

import { useClearMyPresenceOverride } from '../hooks/use-clear-my-presence-override.js';
import { useMyPresence } from '../hooks/use-my-presence.js';
import { useSetMyPresence } from '../hooks/use-set-my-presence.js';

import { PresenceDot } from './presence-dot.js';

import type { ManualPresenceStatus, PresenceResponse, SetPresenceRequest } from '@granit/presence';
import type { ISODateString } from '@granit/types';
import type { CSSProperties, ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

export interface PresencePickerLabels {
  readonly title?: string;
  readonly statusLabel?: Record<ManualPresenceStatus, string>;
  readonly until?: string;
  readonly customUntil?: string;
  readonly clear?: string;
  readonly save?: string;
  readonly noOverride?: string;
  readonly invalidUntil?: string;
  readonly overrideUntil?: (untilLocal: string) => string;
  readonly presets?: {
    readonly thirtyMinutes: string;
    readonly oneHour: string;
    readonly fourHours: string;
    readonly today: string;
    readonly custom: string;
    readonly noExpiry: string;
  };
}

const DEFAULT_LABELS: Required<PresencePickerLabels> = {
  title: 'Set status',
  statusLabel: {
    Available: 'Available',
    Busy: 'Busy',
    DoNotDisturb: 'Do not disturb',
    AppearOffline: 'Appear offline',
  },
  until: 'Clear after',
  customUntil: 'Pick a date and time',
  clear: 'Clear status',
  save: 'Set status',
  noOverride: 'No active override',
  invalidUntil: 'The expiry must be in the future and at most 7 days away.',
  overrideUntil: (untilLocal) => `Until ${untilLocal}`,
  presets: {
    thirtyMinutes: '30 minutes',
    oneHour: '1 hour',
    fourHours: '4 hours',
    today: 'Today',
    custom: 'Custom…',
    noExpiry: "Don't clear",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Preset = 'none' | '30m' | '1h' | '4h' | 'today' | 'custom';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function endOfTodayLocal(now: Date): Date {
  const end = new Date(now);
  end.setHours(23, 59, 0, 0);
  return end;
}

function presetToDate(preset: Preset, now: Date): Date | null {
  switch (preset) {
    case 'none':
      return null;
    case '30m':
      return new Date(now.getTime() + 30 * 60 * 1000);
    case '1h':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case '4h':
      return new Date(now.getTime() + 4 * 60 * 60 * 1000);
    case 'today':
      return endOfTodayLocal(now);
    case 'custom':
      return null;
  }
}

const MAX_OVERRIDE_MS = PRESENCE_DEFAULTS.MaxOverrideDurationSeconds * 1000;

function isValidUntil(date: Date | null, now: Date): boolean {
  if (date == null) return true;
  const diff = date.getTime() - now.getTime();
  return diff > 1_000 && diff <= MAX_OVERRIDE_MS;
}

function toIsoString(date: Date): ISODateString {
  return date.toISOString() as ISODateString;
}

function toLocalDateTimeInputValue(date: Date): string {
  // YYYY-MM-DDTHH:mm in local time, suitable for <input type="datetime-local">.
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function formatUntilLocal(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PresencePickerProps {
  /** Override the English defaults — apps usually thread `t()` results in. */
  readonly labels?: PresencePickerLabels;
  /**
   * Called after a successful Set / Clear. Useful for closing a menu.
   * Receives the fresh server-confirmed presence.
   */
  readonly onApplied?: (presence: PresenceResponse) => void;
  /** Render override around the form. Defaults to an inline-styled div. */
  readonly className?: string;
  /** Custom header (e.g. a heading with shared typography). */
  readonly children?: ReactNode;
}

const MANUAL_OPTIONS: readonly ManualPresenceStatus[] = [
  'Available',
  'Busy',
  'DoNotDisturb',
  'AppearOffline',
];

const FORM_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  padding: '0.75rem',
  font: 'inherit',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Manual override picker for the current user. Pairs naturally with
 * {@link useMyPresence} via the same `<PresenceProvider>`.
 *
 * The component is headless w.r.t. menu/popover chrome — host it in
 * whatever container suits the app (`<DropdownMenu>`, dialog, …). All
 * mutations go through the existing TanStack Query hooks so the cache
 * stays consistent with other places that render presence.
 */
export function PresencePicker({
  labels,
  onApplied,
  className,
  children,
}: Readonly<PresencePickerProps>) {
  const merged: Required<PresencePickerLabels> = {
    ...DEFAULT_LABELS,
    ...labels,
    statusLabel: { ...DEFAULT_LABELS.statusLabel, ...labels?.statusLabel },
    presets: { ...DEFAULT_LABELS.presets, ...labels?.presets },
  };

  const { data: presence } = useMyPresence();
  const setMutation = useSetMyPresence();
  const clearMutation = useClearMyPresenceOverride();

  const [status, setStatus] = useState<ManualPresenceStatus>('Available');
  const [preset, setPreset] = useState<Preset>('1h');
  const [customLocal, setCustomLocal] = useState<string>('');

  // Refresh the reference instant once a minute so preset windows (30 m, 1 h, …)
  // stay anchored to "now" while the picker is open without re-rendering on
  // every keystroke.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const now = useMemo(() => new Date(nowTick), [nowTick]);

  const customDate = useMemo(() => {
    if (preset !== 'custom') return null;
    if (!customLocal) return null;
    const date = new Date(customLocal);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [customLocal, preset]);

  const untilDate = preset === 'custom' ? customDate : presetToDate(preset, now);
  const isAvailable = status === 'Available';
  const untilForRequest = isAvailable ? null : untilDate;
  const customIncomplete = !isAvailable && preset === 'custom' && customDate == null;
  const untilValid = isAvailable ? true : !customIncomplete && isValidUntil(untilForRequest, now);

  const canSubmit = !setMutation.isPending && untilValid;

  const overrideUntilLocal = presence?.overrideUntilUtc
    ? formatUntilLocal(presence.overrideUntilUtc)
    : null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    const request: SetPresenceRequest = {
      manualStatus: status,
      untilUtc: untilForRequest ? toIsoString(untilForRequest) : null,
    };
    const result = await setMutation.mutateAsync(request);
    onApplied?.(result);
  };

  const handleClear = async () => {
    const result = await clearMutation.mutateAsync();
    setStatus('Available');
    setPreset('1h');
    setCustomLocal('');
    onApplied?.(result);
  };

  const minCustomLocal = toLocalDateTimeInputValue(new Date(now.getTime() + 60_000));
  const maxCustomLocal = toLocalDateTimeInputValue(
    new Date(now.getTime() + MAX_OVERRIDE_MS - MS_PER_DAY) // leave headroom
  );

  return (
    <form
      data-granit-presence-picker=""
      className={className}
      style={FORM_STYLE}
      onSubmit={handleSubmit}
    >
      {children ?? <strong>{merged.title}</strong>}

      <div role="radiogroup" aria-label={merged.title} style={{ display: 'grid', gap: '0.25rem' }}>
        {MANUAL_OPTIONS.map((option) => (
          <label
            key={option}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            <input
              type="radio"
              name="granit-presence-status"
              value={option}
              checked={status === option}
              onChange={() => setStatus(option)}
            />
            <PresenceDot
              status={
                option === 'Available' ? 'Online' : option === 'AppearOffline' ? 'Offline' : option
              }
              size={8}
              bordered={false}
              presentational
            />
            <span>{merged.statusLabel[option]}</span>
          </label>
        ))}
      </div>

      {!isAvailable && (
        <fieldset
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 4,
            padding: '0.5rem',
            display: 'grid',
            gap: '0.25rem',
          }}
        >
          <legend style={{ padding: '0 0.25rem' }}>{merged.until}</legend>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="radio"
              name="granit-presence-preset"
              checked={preset === '30m'}
              onChange={() => setPreset('30m')}
            />
            <span>{merged.presets.thirtyMinutes}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="radio"
              name="granit-presence-preset"
              checked={preset === '1h'}
              onChange={() => setPreset('1h')}
            />
            <span>{merged.presets.oneHour}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="radio"
              name="granit-presence-preset"
              checked={preset === '4h'}
              onChange={() => setPreset('4h')}
            />
            <span>{merged.presets.fourHours}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="radio"
              name="granit-presence-preset"
              checked={preset === 'today'}
              onChange={() => setPreset('today')}
            />
            <span>{merged.presets.today}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="radio"
              name="granit-presence-preset"
              checked={preset === 'none'}
              onChange={() => setPreset('none')}
            />
            <span>{merged.presets.noExpiry}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="radio"
              name="granit-presence-preset"
              checked={preset === 'custom'}
              onChange={() => setPreset('custom')}
            />
            <span>{merged.presets.custom}</span>
          </label>
          {preset === 'custom' && (
            <input
              aria-label={merged.customUntil}
              type="datetime-local"
              value={customLocal}
              min={minCustomLocal}
              max={maxCustomLocal}
              onChange={(e) => setCustomLocal(e.target.value)}
              data-granit-presence-custom-until=""
              style={{ marginLeft: '1.5rem' }}
            />
          )}
        </fieldset>
      )}

      {!untilValid && (
        <div data-granit-presence-picker-error="" role="alert" style={{ color: '#b91c1c' }}>
          {merged.invalidUntil}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        {presence?.manualOverride ? (
          <button
            type="button"
            onClick={handleClear}
            disabled={clearMutation.isPending}
            data-granit-presence-clear=""
          >
            {merged.clear}
          </button>
        ) : (
          <span
            data-granit-presence-no-override=""
            style={{ color: '#6b7280', marginRight: 'auto' }}
          >
            {merged.noOverride}
          </span>
        )}
        <button type="submit" disabled={!canSubmit} data-granit-presence-save="">
          {merged.save}
        </button>
      </div>

      {overrideUntilLocal && presence?.manualOverride && (
        <div data-granit-presence-current-override="" style={{ color: '#6b7280', fontSize: 12 }}>
          {merged.overrideUntil(overrideUntilLocal)}
        </div>
      )}
    </form>
  );
}
