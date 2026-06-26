import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@granit/react-ui';
import { cn } from '@granit/utils';
import { Activity, CheckCircle2, WifiOff, XCircle } from 'lucide-react';

import type { ServiceHealthResponse, ServiceStatus } from '@granit/diagnostics';

const statusConfig: Record<
  ServiceStatus,
  { icon: React.ElementType; colorClass: string; badgeClass: string }
> = {
  healthy: {
    icon: CheckCircle2,
    colorClass: 'text-success-600',
    badgeClass: 'border-success-500/25 bg-success-500/15 text-success',
  },
  degraded: {
    icon: Activity,
    colorClass: 'text-warning-600',
    badgeClass: 'border-warning-500/25 bg-warning-500/15 text-warning',
  },
  down: {
    icon: XCircle,
    colorClass: 'text-alert-600',
    badgeClass: 'border-alert-500/25 bg-alert-500/15 text-alert',
  },
};

interface ServiceHealthCardProps {
  service: ServiceHealthResponse;
  checkedAt: string;
}

export function ServiceHealthCard({ service, checkedAt }: Readonly<ServiceHealthCardProps>) {
  const { t } = useTranslation();
  const { formatTimeAgo } = useDateFormatter();
  const config = statusConfig[service.status];
  const StatusIcon = config.icon;

  return (
    <Card
      data-slot="service-health-card"
      data-status={service.status}
      className={cn(
        'card-shadow transition-all',
        service.status === 'down' && 'border-alert-500/40',
        service.status === 'degraded' && 'border-warning-500/40'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-foreground">{service.name}</CardTitle>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <StatusIcon className={cn('h-4 w-4', config.colorClass)} aria-hidden="true" />
            <Badge variant="outline" className={cn('text-xs', config.badgeClass)}>
              {t(`Diagnostics.Status.${service.status}`)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {service.description && (
          <p className="text-xs text-muted-foreground">{service.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {service.responseTimeMs === null
              ? '—'
              : t('Diagnostics.ResponseTime', { ms: service.responseTimeMs })}
          </span>
          {service.tags.length > 0 && (
            <div className="flex gap-1">
              {service.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground/70">
          {t('Diagnostics.LastChecked', { time: formatTimeAgo(checkedAt) })}
        </p>

        {service.status === 'down' && (
          <div
            className="flex items-center gap-1.5 rounded bg-alert-500/10 px-2 py-1.5"
            role="alert"
            aria-live="polite"
          >
            <WifiOff className="h-3.5 w-3.5 text-alert-600" aria-hidden="true" />
            <span className="text-xs font-medium text-alert">
              {t('Diagnostics.ServiceUnreachable', 'Service unreachable')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
