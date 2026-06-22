import { useTranslation } from '@granit/react-localization';
import { Badge } from '@granit/react-ui';

import type { ProductLifecycleStatus } from '@granit/catalog';
import type { ParseKeys } from 'i18next';

interface Props {
  readonly status: ProductLifecycleStatus;
}

const VARIANTS: Record<ProductLifecycleStatus, 'secondary' | 'default' | 'outline'> = {
  Draft: 'secondary',
  Published: 'default',
  Archived: 'outline',
};

const TRANSLATION_KEYS: Record<ProductLifecycleStatus, ParseKeys> = {
  Draft: 'Catalog.Lifecycle.Draft',
  Published: 'Catalog.Lifecycle.Published',
  Archived: 'Catalog.Lifecycle.Archived',
};

export function LifecycleStatusBadge({ status }: Props) {
  const { t } = useTranslation();
  return <Badge variant={VARIANTS[status]}>{t(TRANSLATION_KEYS[status])}</Badge>;
}
