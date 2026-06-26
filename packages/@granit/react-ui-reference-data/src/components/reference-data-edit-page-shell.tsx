import { useTranslation } from '@granit/react-localization';
import { Badge, Button, Separator, Spinner } from '@granit/react-ui';
import { EmptyState } from '@granit/react-ui-kit';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { ReferenceDataEntry } from './types';
import type { ReactNode } from 'react';

interface ReferenceDataEditPageShellProps {
  readonly i18nPrefix: string;
  readonly basePath: string;
  readonly entry: ReferenceDataEntry | undefined;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly onDeactivate: () => void;
  readonly onReactivate: () => void;
  /** Optional subtitle content rendered after the entry name (e.g., extra codes). */
  readonly renderSubtitle?: (entry: ReferenceDataEntry) => ReactNode;
  /** The form and any dialogs to render. */
  readonly children: ReactNode;
}

export function ReferenceDataEditPageShell({
  i18nPrefix,
  basePath,
  entry,
  isLoading,
  error,
  onDeactivate,
  onReactivate,
  renderSubtitle,
  children,
}: ReferenceDataEditPageShellProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div data-slot="reference-data-edit-page" className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link to={basePath}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t(`${i18nPrefix}.Detail.BackToList`)}
            </Link>
          </Button>
        </div>
        <EmptyState icon={AlertCircle} message={t(`${i18nPrefix}.Detail.NotFound`)} />
      </div>
    );
  }

  return (
    <div data-slot="reference-data-edit-page" className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={basePath}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t(`${i18nPrefix}.Detail.BackToList`)}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{entry.labelEn}</h2>
          {renderSubtitle ? (
            renderSubtitle(entry)
          ) : (
            <p className="text-sm text-muted-foreground font-mono">{entry.code}</p>
          )}
        </div>
        <Badge
          variant={entry.activated ? 'default' : 'secondary'}
          className={
            entry.activated
              ? 'bg-success-500/15 text-success border-success-500/25'
              : 'bg-muted/50 text-muted-foreground'
          }
        >
          {entry.activated ? t(`${i18nPrefix}.Status.Active`) : t(`${i18nPrefix}.Status.Inactive`)}
        </Badge>
        <div className="ml-auto">
          {entry.activated ? (
            <Button variant="outline" size="sm" className="text-alert-600" onClick={onDeactivate}>
              {t(`${i18nPrefix}.Actions.Deactivate`)}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onReactivate}>
              {t(`${i18nPrefix}.Actions.Reactivate`)}
            </Button>
          )}
        </div>
      </div>

      {/* Form and dialogs */}
      {children}
    </div>
  );
}
