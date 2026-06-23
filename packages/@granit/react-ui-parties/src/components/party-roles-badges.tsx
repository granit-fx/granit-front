import { useTranslation } from '@granit/react-localization';
import { Badge } from '@granit/react-ui';

import { parsePartyRoleFlags } from '../constants';

interface PartyRolesBadgesProps {
  readonly roles: string | null | undefined;
}

export function PartyRolesBadges({ roles }: PartyRolesBadgesProps) {
  const { t } = useTranslation();
  const flags = parsePartyRoleFlags(roles ?? null);

  if (flags.length === 0) {
    return <span className="text-xs text-muted-foreground">{t('Parties.Role.None')}</span>;
  }

  return (
    <div data-slot="party-roles-badges" className="flex flex-wrap gap-1">
      {flags.map((role) => (
        <Badge key={role} variant="secondary" className="text-xs">
          {t(`Parties.Role.${role}`)}
        </Badge>
      ))}
    </div>
  );
}
