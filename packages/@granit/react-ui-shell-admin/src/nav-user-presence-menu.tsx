import type { ManualPresenceStatus, PresenceStatus } from '@granit/presence';
import { useTranslation } from '@granit/react-localization';
import {
  PresenceDot,
  useClearMyPresenceOverride,
  useMyPresence,
  useSetMyPresence,
} from '@granit/react-presence';
import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@granit/react-ui';
import type { ISODateString } from '@granit/types';
import { Clock, RotateCcw } from 'lucide-react';

// Labels come from the framework's `presence` namespace bundle so this menu
// works in any locale without depending on the backend localization table
// shipping `Presence.*` keys. The bundle is registered in `src/lib/i18n.ts`.

interface StatusOption {
  readonly status: ManualPresenceStatus;
  /** Translation key inside the `presence` namespace. */
  readonly labelKey: string;
}

const STATUS_OPTIONS: readonly StatusOption[] = [
  { status: 'Available', labelKey: 'Manual.Available' },
  { status: 'Busy', labelKey: 'Manual.Busy' },
  { status: 'DoNotDisturb', labelKey: 'Manual.DoNotDisturb' },
  // Display the AppearOffline action as just "Offline" (Teams convention).
  { status: 'AppearOffline', labelKey: 'Status.Offline' },
] as const;

interface DurationOption {
  readonly id: 'noExpiry' | '30m' | '1h' | '4h' | 'today';
  /** Translation key inside the `presence` namespace. */
  readonly labelKey: string;
  /** Returns an ISO string in the future, or `null` for no expiry. */
  readonly compute: (now: Date) => ISODateString | null;
}

function endOfTodayLocal(now: Date): Date {
  const end = new Date(now);
  end.setHours(23, 59, 0, 0);
  return end;
}

function toIso(date: Date): ISODateString {
  return date.toISOString() as ISODateString;
}

const DURATION_OPTIONS: readonly DurationOption[] = [
  { id: 'noExpiry', labelKey: 'Picker.Presets.NoExpiry', compute: () => null },
  {
    id: '30m',
    labelKey: 'Picker.Presets.ThirtyMinutes',
    compute: (now) => toIso(new Date(now.getTime() + 30 * 60 * 1000)),
  },
  {
    id: '1h',
    labelKey: 'Picker.Presets.OneHour',
    compute: (now) => toIso(new Date(now.getTime() + 60 * 60 * 1000)),
  },
  {
    id: '4h',
    labelKey: 'Picker.Presets.FourHours',
    compute: (now) => toIso(new Date(now.getTime() + 4 * 60 * 60 * 1000)),
  },
  {
    id: 'today',
    labelKey: 'Picker.Presets.Today',
    compute: (now) => toIso(endOfTodayLocal(now)),
  },
] as const;

/**
 * Maps the manual override the user picks to the effective status the dot
 * should render. The dot in the picker row reflects what the system will
 * compute server-side, not the override action itself.
 */
function manualToEffective(status: ManualPresenceStatus): PresenceStatus {
  if (status === 'Available') return 'Online';
  if (status === 'AppearOffline') return 'Offline';
  return status;
}

export function NavUserPresenceMenu() {
  // Granit's `useTranslation` auto-restores the key/ns separators when a
  // custom namespace is used (the framework's nested `presence` bundle needs
  // them, but the showcase disables them globally for flat backend keys).
  const { t } = useTranslation('presence');
  const my = useMyPresence();
  const setMyPresence = useSetMyPresence();
  const clearOverride = useClearMyPresenceOverride();

  const effectiveStatus = my.data?.effectiveStatus ?? 'Offline';
  const currentOverride = my.data?.manualOverride ?? null;
  const hasOverride = currentOverride !== null;

  // Trigger reflects the effective status (Online → "En ligne",
  // Away → "Absent", …) so the AppearOffline action shows as "Hors ligne"
  // once active, matching Teams.
  const triggerLabel = t(`Status.${effectiveStatus}`);

  const handleStatusSelect = (status: ManualPresenceStatus) => {
    setMyPresence.mutate({ manualStatus: status, untilUtc: null });
  };

  const handleDurationSelect = (duration: DurationOption) => {
    if (!currentOverride) return;
    setMyPresence.mutate({
      manualStatus: currentOverride,
      untilUtc: duration.compute(new Date()),
    });
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger data-slot="nav-user-presence-trigger">
        <PresenceDot status={effectiveStatus} className="mr-2" presentational />
        {triggerLabel}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="min-w-[200px]">
          {STATUS_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.status}
              onSelect={(e) => {
                e.preventDefault();
                handleStatusSelect(option.status);
              }}
              data-active={currentOverride === option.status ? 'true' : undefined}
            >
              <PresenceDot
                status={manualToEffective(option.status)}
                className="mr-2"
                presentational
              />
              {t(option.labelKey)}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              disabled={!hasOverride}
              className="data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            >
              <Clock className="mr-2 h-4 w-4" />
              {t('Picker.Until')}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {DURATION_OPTIONS.map((d) => (
                  <DropdownMenuItem
                    key={d.id}
                    onSelect={(e) => {
                      e.preventDefault();
                      handleDurationSelect(d);
                    }}
                  >
                    {t(d.labelKey)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              clearOverride.mutate();
            }}
            disabled={!hasOverride}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('Picker.Clear')}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
