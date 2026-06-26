import { useTranslation } from '@granit/react-localization';
import { Badge } from '@granit/react-ui';
import { cn } from '@granit/utils';

import type { LegalDocumentLifecycleStatus } from '@granit/privacy';

const statusStyles: Record<LegalDocumentLifecycleStatus, string> = {
  Draft: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25',
  Published: 'bg-success-500/15 text-success border-success-500/25',
  Archived: 'bg-muted/50 text-muted-foreground',
};

interface LegalDocumentStatusBadgeProps {
  readonly status: LegalDocumentLifecycleStatus;
}

export function LegalDocumentStatusBadge({ status }: LegalDocumentStatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <Badge
      data-slot="legal-document-status-badge"
      variant="outline"
      className={cn('text-xs', statusStyles[status])}
    >
      {t(`Privacy.LegalDocuments.Status.${status}`)}
    </Badge>
  );
}
