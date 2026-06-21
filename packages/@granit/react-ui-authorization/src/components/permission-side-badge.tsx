import { useTranslation } from '@granit/react-localization';
import { Badge } from '@granit/react-ui';

import type { PermissionMultiTenancySide } from '@granit/authorization';

const VARIANT_BY_SIDE: Record<PermissionMultiTenancySide, 'default' | 'secondary' | 'outline'> = {
  Host: 'secondary',
  Tenant: 'default',
  Both: 'outline',
};

export function PermissionSideBadge({ side }: { readonly side: PermissionMultiTenancySide }) {
  const { t } = useTranslation();
  return (
    <Badge variant={VARIANT_BY_SIDE[side]} className="text-[10px]">
      {t(`Permissions.Side.${side}`)}
    </Badge>
  );
}
