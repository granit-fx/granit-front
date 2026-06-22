import { useTranslation } from '@granit/react-localization';
import { cn } from '@granit/utils';
import { cva } from 'class-variance-authority';

import type { ApiKeyType } from '@granit/authentication-api-keys';

const apiKeyTypeBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      type: {
        Secret: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        Publishable: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        Webhook: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        Ephemeral: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      },
    },
    defaultVariants: {
      type: 'Secret',
    },
  }
);

const TYPE_LABELS: Record<ApiKeyType, string> = {
  Secret: 'ApiKeys.Types.Secret',
  Publishable: 'ApiKeys.Types.Publishable',
  Webhook: 'ApiKeys.Types.Webhook',
  Ephemeral: 'ApiKeys.Types.Ephemeral',
};

interface ApiKeyTypeBadgeProps {
  type: ApiKeyType;
  className?: string;
}

export function ApiKeyTypeBadge({ type, className }: Readonly<ApiKeyTypeBadgeProps>) {
  const { t } = useTranslation();

  return (
    <span
      data-slot="api-key-type-badge"
      className={cn(apiKeyTypeBadgeVariants({ type }), className)}
    >
      {t(TYPE_LABELS[type])}
    </span>
  );
}
