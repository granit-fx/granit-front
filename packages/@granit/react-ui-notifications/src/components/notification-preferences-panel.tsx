import { updatePreference } from '@granit/notifications';
import { useTranslation } from '@granit/react-localization';
import {
  useNotificationConfig,
  useNotificationPreferences,
  useNotificationTypes,
} from '@granit/react-notifications';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from '@granit/react-ui';
import { cn } from '@granit/utils';
import { Settings } from 'lucide-react';
import { useState, useTransition } from 'react';

import type { NotificationChannel, NotificationDefinition } from '@granit/notifications';

const channels: NotificationChannel[] = ['InApp', 'Email', 'Push'];
const DEFAULT_BASE_PATH = '/api/v1';

type PendingKey = `${string}::${string}`;

const keyOf = (typeName: string, channel: string): PendingKey => `${typeName}::${channel}`;

export function NotificationPreferencesPanel() {
  const { t } = useTranslation();
  const { config } = useNotificationConfig();
  const basePath = config.basePath ?? DEFAULT_BASE_PATH;

  const { data: definitions = [], isLoading: typesLoading } = useNotificationTypes();
  const {
    preferences,
    loading: prefsLoading,
    togglePreference,
    refresh,
  } = useNotificationPreferences();

  const [pending, setPending] = useState<Map<PendingKey, boolean>>(new Map());
  const [saving, startTransition] = useTransition();

  if (typesLoading || prefsLoading) {
    return (
      <Card data-slot="notification-preferences">
        <CardContent className="flex justify-center py-12">
          <Spinner size="md" />
        </CardContent>
      </Card>
    );
  }

  const visibleDefinitions = definitions.filter((d) => d.allowUserOptOut);

  const findPreference = (typeName: string, channel: string) =>
    preferences.find((p) => p.notificationTypeName === typeName && p.channelName === channel);

  const isChecked = (def: NotificationDefinition, channel: string): boolean => {
    const pendingValue = pending.get(keyOf(def.name, channel));
    if (pendingValue !== undefined) return pendingValue;

    const pref = findPreference(def.name, channel);
    if (pref) return pref.isEnabled;

    return def.defaultChannels.includes(channel);
  };

  const handleToggle = (def: NotificationDefinition, channel: string, isEnabled: boolean) => {
    const key = keyOf(def.name, channel);
    const existing = findPreference(def.name, channel);

    if (existing) {
      togglePreference(existing.id, isEnabled);
      return;
    }

    // No preference row yet — create one via upsert.
    setPending((prev) => new Map(prev).set(key, isEnabled));
    startTransition(async () => {
      try {
        await updatePreference(config.apiClient, basePath, {
          notificationTypeName: def.name,
          channelName: channel,
          isEnabled,
        });
        refresh();
      } finally {
        setPending((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      }
    });
  };

  return (
    <Card data-slot="notification-preferences">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t('Notifications.Preferences')}
        </CardTitle>
        <CardDescription>{t('Notifications.PreferencesDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {visibleDefinitions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('Notifications.NoTypesAvailable')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 pr-4 text-left font-medium text-muted-foreground">
                    {t('Components.Notifications.Preferences.Type')}
                  </th>
                  {channels.map((channel) => (
                    <th
                      key={channel}
                      className="px-4 py-3 text-center font-medium text-muted-foreground"
                    >
                      {t(`Notifications.Channels.${channel}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleDefinitions.map((def) => (
                  <tr key={def.name} className="hover:bg-accent">
                    <td className="py-3 pr-4 text-foreground">
                      <div className="font-medium">{def.displayName ?? def.name}</div>
                      {def.description && (
                        <div className="text-xs text-muted-foreground">{def.description}</div>
                      )}
                    </td>
                    {channels.map((channel) => (
                      <td key={channel} className="px-4 py-3 text-center">
                        <label className="inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={isChecked(def, channel)}
                            disabled={saving}
                            onChange={(e) => handleToggle(def, channel, e.target.checked)}
                            className={cn(
                              'h-4 w-4 rounded border-input text-primary focus:ring-primary',
                              saving && 'opacity-50'
                            )}
                            aria-label={[
                              def.displayName ?? def.name,
                              t(`Notifications.Channels.${channel}`),
                            ].join(' - ')}
                          />
                        </label>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
