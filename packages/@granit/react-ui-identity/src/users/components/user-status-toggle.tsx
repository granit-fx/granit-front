import { useTranslation } from '@granit/react-localization';
import { Switch } from '@granit/react-ui';
import { cn } from '@granit/utils';

interface UserStatusToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export function UserStatusToggle({
  enabled,
  onToggle,
  disabled = false,
}: Readonly<UserStatusToggleProps>) {
  const { t } = useTranslation();

  return (
    <div data-slot="user-status-toggle" className="flex items-center gap-2">
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        disabled={disabled}
        aria-label={
          enabled
            ? t('Users.Status.DisableAction', 'Disable user')
            : t('Users.Status.EnableAction', 'Enable user')
        }
      />
      <span
        className={cn(
          'text-sm font-medium',
          enabled ? 'text-success-600' : 'text-muted-foreground/70'
        )}
      >
        {enabled ? t('Users.Status.Enabled') : t('Users.Status.Disabled')}
      </span>
    </div>
  );
}
