import { useTranslation } from '@granit/react-localization';
import { Badge } from '@granit/react-ui';

import type { FeatureDefinitionResponse } from '@granit/features';

interface FeatureValueBadgeProps {
  readonly definition: FeatureDefinitionResponse;
  readonly value: string;
}

export function FeatureValueBadge({ definition, value }: FeatureValueBadgeProps) {
  const { t } = useTranslation();

  switch (definition.valueType) {
    case 'Toggle': {
      const isEnabled = value === 'true';
      return (
        <Badge
          data-slot="feature-value-badge"
          variant={isEnabled ? 'default' : 'destructive'}
          className={isEnabled ? 'bg-success-600 hover:bg-success-600/90' : undefined}
        >
          {isEnabled ? t('Features.Value.Enabled') : t('Features.Value.Disabled')}
        </Badge>
      );
    }
    case 'Selection':
      return (
        <Badge data-slot="feature-value-badge" variant="secondary">
          {value}
        </Badge>
      );
    case 'Numeric':
    default:
      return (
        <Badge data-slot="feature-value-badge" variant="outline">
          {value}
        </Badge>
      );
  }
}
