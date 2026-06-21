import { useTranslation } from '@granit/react-localization';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';

import { AuditChangeTypeBadge } from './audit-change-type-badge';

import type { AuditEntityChangeResponse } from '@granit/auditing';

interface AuditEntityChangeCardProps {
  readonly change: AuditEntityChangeResponse;
}

export function AuditEntityChangeCard({ change }: AuditEntityChangeCardProps) {
  const { t } = useTranslation();

  return (
    <Card data-slot="audit-entity-change-card">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-mono text-sm">
            {change.entityType}
            <span className="text-muted-foreground"> · {change.entityId}</span>
          </CardTitle>
          <AuditChangeTypeBadge changeType={change.changeType} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Audit.PropertyChanges.Property')}</TableHead>
                <TableHead>{t('Audit.PropertyChanges.OriginalValue')}</TableHead>
                <TableHead>{t('Audit.PropertyChanges.NewValue')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {change.propertyChanges.length > 0 ? (
                change.propertyChanges.map((property) => (
                  <TableRow key={property.propertyName}>
                    <TableCell className="font-mono text-xs">{property.propertyName}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {property.originalValue ?? '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{property.newValue ?? '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                    {t('Common.NoResults')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
