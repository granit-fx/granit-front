import { useTranslation } from '@granit/react-localization';
import { Badge } from '@granit/react-ui';

import type { AuditCategoryValue } from '@granit/auditing';

const CATEGORY_VARIANT: Record<
  AuditCategoryValue,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  DataMutation: 'default',
  ConfigurationChange: 'secondary',
  DataAccess: 'outline',
  AccessDenied: 'destructive',
  PrivilegedAccess: 'destructive',
};

interface AuditCategoryBadgeProps {
  readonly category: AuditCategoryValue;
}

export function AuditCategoryBadge({ category }: AuditCategoryBadgeProps) {
  const { t } = useTranslation();

  return (
    <Badge
      data-slot="audit-category-badge"
      variant={CATEGORY_VARIANT[category]}
      className="text-xs"
    >
      {t(`Audit.Categories.${category}`)}
    </Badge>
  );
}
