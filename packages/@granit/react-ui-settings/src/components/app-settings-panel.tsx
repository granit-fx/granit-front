import { useTranslation } from '@granit/react-localization';
import { useAdminAppSettings, useBulkUpdateSettings } from '@granit/react-settings';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Switch,
} from '@granit/react-ui';
import * as React from 'react';
import { toast } from 'sonner';

import type {
  AdminAppSettingResponse,
  AdminSettingsScope,
  BulkSettingEntry,
  ValueKind,
} from '@granit/settings';

/** Sentinel used when an encrypted field is in its masked (unedited) state. */
const ENCRYPTED_UNCHANGED = '__GRANIT_ENCRYPTED_UNCHANGED__';

type FormValues = Record<string, string>;

export interface AppSettingsPanelProps {
  /**
   * Settings scope to read/write. Host apps pass `'global'`, tenant apps pass
   * `'tenant'`. Defaults to `'global'` so the package never depends on an app's
   * host/tenant flag.
   */
  readonly scope?: AdminSettingsScope;
}

/** Format initial value for the form (encrypted → sentinel, null → default/''). */
function toFormValue(setting: AdminAppSettingResponse): string {
  if (setting.isEncrypted) return ENCRYPTED_UNCHANGED;
  return setting.value ?? setting.defaultValue ?? '';
}

export function AppSettingsPanel({ scope = 'global' }: AppSettingsPanelProps = {}) {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useAdminAppSettings(scope);
  const saveMutation = useBulkUpdateSettings(scope);

  const defaults = React.useMemo<FormValues>(
    () => Object.fromEntries((settings ?? []).map((s) => [s.key, toFormValue(s)])),
    [settings]
  );

  const [values, setValues] = React.useState<FormValues>(() => defaults);
  const [editingEncrypted, setEditingEncrypted] = React.useState<ReadonlySet<string>>(new Set());
  const lastAppliedDefaults = React.useRef<FormValues>(defaults);

  React.useEffect(() => {
    // Only reset when the definitions catalog itself changed (new ref from the
    // query) — otherwise user edits during a re-render would be silently
    // clobbered by a defaults-from-props re-sync.
    if (lastAppliedDefaults.current !== defaults) {
      lastAppliedDefaults.current = defaults;
      setValues(defaults);
      setEditingEncrypted(new Set());
    }
  }, [defaults]);

  const setFieldValue = React.useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onReset = () => {
    setValues(defaults);
    setEditingEncrypted(new Set());
  };

  const collectChangedEntries = (): BulkSettingEntry[] => {
    if (!settings) return [];
    const changed: BulkSettingEntry[] = [];
    for (const setting of settings) {
      const current = values[setting.key] ?? '';
      const baseline = defaults[setting.key] ?? '';
      if (current === baseline) continue;
      if (setting.isEncrypted && current === ENCRYPTED_UNCHANGED) continue;
      changed.push({ key: setting.key, value: current === '' ? null : current });
    }
    return changed;
  };

  const reportSaveOutcome = (
    failures: ReadonlyArray<{ readonly key: string; readonly errorCode?: string | null }>
  ) => {
    if (failures.length === 0) {
      toast.success(t('Config.AppSettings.SaveSuccess'));
      return;
    }
    for (const failure of failures) {
      const message = failure.errorCode
        ? t(failure.errorCode, { key: failure.key })
        : t('Config.AppSettings.SaveErrorRow', { key: failure.key });
      toast.error(message);
    }
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings) return;

    const changed = collectChangedEntries();
    if (changed.length === 0) {
      toast.info(t('Config.AppSettings.NoChanges'));
      return;
    }

    // `mutate` (not `mutateAsync`) routes failures to the global
    // MutationCache.onError toast — no local catch needed.
    saveMutation.mutate(changed, {
      onSuccess: (response) => {
        const failures = response.results.filter((r) => r.outcome !== 'Updated');
        reportSaveOutcome(failures);
      },
    });
  };

  return (
    <Card data-slot="app-settings-panel">
      <CardHeader>
        <CardTitle className="text-base">{t('Config.AppSettings.Title')}</CardTitle>
        <CardDescription>{t('Config.AppSettings.Subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={`skeleton-${i}`} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        )}

        {settings && settings.length > 0 && (
          <form onSubmit={onSubmit} className="space-y-4">
            {settings.map((setting) => (
              <SettingField
                key={setting.key}
                setting={setting}
                value={values[setting.key] ?? ''}
                onChange={(v) => setFieldValue(setting.key, v)}
                isEditingEncrypted={editingEncrypted.has(setting.key)}
                onStartEditingEncrypted={() => {
                  setEditingEncrypted((prev) => new Set(prev).add(setting.key));
                  setFieldValue(setting.key, '');
                }}
              />
            ))}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? t('Common.Saving') : t('Common.Save')}
              </Button>
              <Button type="button" variant="outline" onClick={onReset}>
                {t('Common.Reset')}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Field renderer
// ---------------------------------------------------------------------------

type SettingFieldProps = {
  readonly setting: AdminAppSettingResponse;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly isEditingEncrypted: boolean;
  readonly onStartEditingEncrypted: () => void;
};

function SettingField({
  setting,
  value,
  onChange,
  isEditingEncrypted,
  onStartEditingEncrypted,
}: SettingFieldProps) {
  const { t } = useTranslation();

  const label = setting.label ?? t(`Setting:${setting.key}`, { defaultValue: setting.key });
  const description =
    setting.description ?? t(`Setting:${setting.key}:Description`, { defaultValue: '' });

  const inputId = `setting-${setting.key}`;
  const isBool = setting.valueKind === 'Bool';

  return (
    <div
      className={
        isBool ? 'flex items-center justify-between gap-4 rounded-lg border p-4' : 'space-y-2'
      }
      data-slot="setting-field"
      data-setting-key={setting.key}
    >
      <div className="space-y-0.5">
        <Label htmlFor={inputId}>{label}</Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {renderControl(setting, value, onChange, {
        inputId,
        isEditingEncrypted,
        onStartEditingEncrypted,
        t,
      })}
    </div>
  );
}

function renderControl(
  setting: AdminAppSettingResponse,
  value: string,
  onChange: (value: string) => void,
  ctx: {
    readonly inputId: string;
    readonly isEditingEncrypted: boolean;
    readonly onStartEditingEncrypted: () => void;
    readonly t: (key: string, options?: Record<string, unknown>) => string;
  }
) {
  if (setting.isEncrypted && !ctx.isEditingEncrypted && value === ENCRYPTED_UNCHANGED) {
    return (
      <div className="flex items-center gap-2">
        <Input id={ctx.inputId} value="••••••••" disabled className="font-mono" readOnly />
        <Button type="button" variant="outline" size="sm" onClick={ctx.onStartEditingEncrypted}>
          {ctx.t('Config.AppSettings.ChangeSecret')}
        </Button>
      </div>
    );
  }

  if (setting.allowedValues && setting.allowedValues.length > 0) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={ctx.inputId}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {setting.allowedValues.map((option) => (
            <SelectItem key={option} value={option}>
              {ctx.t(`Setting:${setting.key}:Option:${option}`, { defaultValue: option })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return renderByKind(setting.valueKind, value, onChange, ctx.inputId, setting.isEncrypted);
}

function renderByKind(
  kind: ValueKind,
  value: string,
  onChange: (value: string) => void,
  inputId: string,
  isEncrypted: boolean
): React.ReactNode {
  switch (kind) {
    case 'Bool':
      return (
        <Switch
          id={inputId}
          checked={value === 'true'}
          onCheckedChange={(checked) => onChange(String(checked))}
        />
      );
    case 'Int':
      return (
        <Input
          id={inputId}
          type="number"
          step="1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono"
        />
      );
    case 'Double':
      return (
        <Input
          id={inputId}
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono"
        />
      );
    case 'Json':
      return (
        <textarea
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
          spellCheck={false}
        />
      );
    case 'String':
    default:
      return (
        <Input
          id={inputId}
          type={isEncrypted ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono"
        />
      );
  }
}
