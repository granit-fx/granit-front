import { useTranslation } from '@granit/react-localization';
import { Button } from '@granit/react-ui';
import { cn } from '@granit/utils';
import { RefreshCw } from 'lucide-react';
import * as React from 'react';

const REFRESH_INTERVAL_SECONDS = 30;

interface AutoRefreshIndicatorProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function AutoRefreshIndicator({
  onRefresh,
  isRefreshing = false,
}: Readonly<AutoRefreshIndicatorProps>) {
  const { t } = useTranslation();
  const [countdown, setCountdown] = React.useState(REFRESH_INTERVAL_SECONDS);

  React.useEffect(() => {
    setCountdown(REFRESH_INTERVAL_SECONDS);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRefreshing]);

  return (
    <div data-slot="auto-refresh-indicator" className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">
        {t('Diagnostics.AutoRefresh', { seconds: countdown })}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
        aria-label={t('Diagnostics.RefreshAriaLabel')}
      >
        <RefreshCw
          className={cn('mr-1.5 h-3.5 w-3.5', isRefreshing && 'animate-spin')}
          aria-hidden="true"
        />
        {t('Common.Refresh')}
      </Button>
    </div>
  );
}
