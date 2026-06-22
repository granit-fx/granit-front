import { useTranslation } from '@granit/react-localization';
import { cn } from '@granit/utils';
import { cva } from 'class-variance-authority';

const apiKeyEnvironmentBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      environment: {
        live: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        test: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        dev: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      },
    },
    defaultVariants: {
      environment: 'dev',
    },
  }
);

const ENV_LABELS: Record<string, string> = {
  live: 'ApiKeys.Environments.Live',
  test: 'ApiKeys.Environments.Test',
  dev: 'ApiKeys.Environments.Dev',
};

interface ApiKeyEnvironmentBadgeProps {
  environment: string;
  className?: string;
}

export function ApiKeyEnvironmentBadge({
  environment,
  className,
}: Readonly<ApiKeyEnvironmentBadgeProps>) {
  const { t } = useTranslation();
  const env = environment as 'live' | 'test' | 'dev';

  return (
    <span
      data-slot="api-key-environment-badge"
      className={cn(apiKeyEnvironmentBadgeVariants({ environment: env }), className)}
    >
      {t(ENV_LABELS[environment] ?? environment)}
    </span>
  );
}
