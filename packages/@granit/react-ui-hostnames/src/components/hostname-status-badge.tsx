import { CertificateStatus, HostnameStatus } from '@granit/hostnames';
import { useTranslation } from '@granit/react-localization';
import { Badge } from '@granit/react-ui';

import type { ManagedHostnameResponse } from '@granit/hostnames';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

function hostnameStatusVariant(status: ManagedHostnameResponse['status']): BadgeVariant {
  if (status === HostnameStatus.Active) return 'default';
  if (status === HostnameStatus.Error) return 'destructive';
  return 'outline';
}

function hostnameStatusClassName(status: ManagedHostnameResponse['status']): string | undefined {
  if (status === HostnameStatus.Active) return 'bg-success-100 text-success-600 border-success-100';
  if (status === HostnameStatus.Verifying)
    return 'bg-warning-100 text-warning-600 border-warning-100';
  return undefined;
}

function certStatusVariant(status: ManagedHostnameResponse['certificateStatus']): BadgeVariant {
  if (status === CertificateStatus.Secured) return 'default';
  if (status === CertificateStatus.Error) return 'destructive';
  return 'outline';
}

export function HostnameStatusBadge({
  status,
}: {
  readonly status: ManagedHostnameResponse['status'];
}) {
  const { t } = useTranslation();

  const variant = hostnameStatusVariant(status);
  const className = hostnameStatusClassName(status);

  return (
    <Badge variant={variant} className={className}>
      {t(`Hostnames.Status.${status}`)}
    </Badge>
  );
}

export function CertStatusBadge({
  status,
}: {
  readonly status: ManagedHostnameResponse['certificateStatus'];
}) {
  const { t } = useTranslation();

  const variant = certStatusVariant(status);

  const className =
    status === CertificateStatus.Secured
      ? 'bg-success-100 text-success-600 border-success-100'
      : undefined;

  return (
    <Badge variant={variant} className={className}>
      {t(`Hostnames.Certificate.${status}`)}
    </Badge>
  );
}
