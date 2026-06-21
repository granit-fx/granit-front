import { useTranslation } from '@granit/react-localization';
import { Badge } from '@granit/react-ui';

import type { AuditChangeTypeValue } from '@granit/auditing';

const CHANGE_TYPE_VARIANT: Record<
  AuditChangeTypeValue,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  Created: 'default',
  Modified: 'secondary',
  Deleted: 'destructive',
  SoftDeleted: 'outline',
};

interface AuditChangeTypeBadgeProps {
  readonly changeType: AuditChangeTypeValue;
}

export function AuditChangeTypeBadge({ changeType }: AuditChangeTypeBadgeProps) {
  const { t } = useTranslation();

  return (
    <Badge
      data-slot="audit-change-type-badge"
      variant={CHANGE_TYPE_VARIANT[changeType]}
      className="text-xs"
    >
      {t(`Audit.ChangeTypes.${changeType}`)}
    </Badge>
  );
}
