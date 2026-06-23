import { useTranslation } from '@granit/react-localization';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@granit/react-ui';
import { cn } from '@granit/utils';
import { MoreHorizontal } from 'lucide-react';

import type { ReferenceDataEntry } from './types';
import type { ReactNode } from 'react';

interface ReferenceDataCardProps {
  readonly entry: ReferenceDataEntry;
  readonly onEdit: (code: string) => void;
  readonly onDeactivate: (entry: ReferenceDataEntry) => void;
  readonly onReactivate: (entry: ReferenceDataEntry) => void;
  readonly i18nPrefix?: string;
  /** Slot for app-specific content rendered after base fields. */
  readonly children?: ReactNode;
}

export function ReferenceDataCard({
  entry,
  onEdit,
  onDeactivate,
  onReactivate,
  i18nPrefix = 'ReferenceData.Common',
  children,
}: ReferenceDataCardProps) {
  const { t } = useTranslation();

  return (
    <Card data-slot="reference-data-card" className={cn(!entry.activated && 'opacity-70')}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="font-mono text-sm">{entry.code}</CardTitle>
            <p className="text-sm text-muted-foreground">{entry.labelFr || entry.labelEn}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={entry.activated ? 'default' : 'secondary'}
              className={cn(
                'text-xs',
                entry.activated
                  ? 'bg-success-500/15 text-success-600 dark:text-success-500 border-success-500/25'
                  : 'bg-muted/50 text-muted-foreground'
              )}
            >
              {entry.activated
                ? t(`${i18nPrefix}.Status.Active`)
                : t(`${i18nPrefix}.Status.Inactive`)}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label={`Actions for ${entry.labelEn}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(entry.code)}>
                  {t(`${i18nPrefix}.Actions.Edit`)}
                </DropdownMenuItem>
                {entry.activated ? (
                  <DropdownMenuItem onClick={() => onDeactivate(entry)} className="text-alert-600">
                    {t(`${i18nPrefix}.Actions.Deactivate`)}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onReactivate(entry)}>
                    {t(`${i18nPrefix}.Actions.Reactivate`)}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-muted-foreground">{t(`${i18nPrefix}.Columns.LabelEn`)}</p>
            <p className="font-medium">{entry.labelEn}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t(`${i18nPrefix}.Form.SortOrder`)}</p>
            <p className="font-mono font-medium">{entry.sortOrder}</p>
          </div>
        </div>

        {/* App-specific content slot */}
        {children}

        {entry.metadata && Object.keys(entry.metadata).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(entry.metadata).map(([key, value]) => (
              <Badge key={key} variant="outline" className="text-[10px] font-normal">
                {key}: {value}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
