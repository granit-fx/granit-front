import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  useTemplateHistory,
  useTemplateMutations,
  useTemplatingConfig,
} from '@granit/react-templating';
import { Button, Checkbox, Skeleton, toast } from '@granit/react-ui';
import { ConfirmActionDialog } from '@granit/react-ui-kit';
import { getRevision } from '@granit/templating';
import { GitCompareArrows, RotateCcw } from 'lucide-react';
import { useState } from 'react';

import { logger } from '../logger';

import { TemplateStatusBadge } from './template-status-badge';

import type { TemplateRevisionSummary } from '@granit/templating';

interface TemplateHistoryProps {
  templateName: string;
  culture?: string;
  onCompare?: (leftId: string, rightId: string) => void;
}

export function TemplateHistory({
  templateName,
  culture,
  onCompare,
}: Readonly<TemplateHistoryProps>) {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const { client, basePath } = useTemplatingConfig();
  const { data: history, isLoading } = useTemplateHistory(templateName, {
    culture,
  });
  const { saveDraft } = useTemplateMutations();
  const [selectedRevisions, setSelectedRevisions] = useState<string[]>([]);
  const [restoreRevisionId, setRestoreRevisionId] = useState<string | null>(null);

  const handleSelectRevision = (revisionId: string) => {
    setSelectedRevisions((prev) =>
      prev.length < 2 ? [...prev, revisionId] : [prev[1] ?? revisionId, revisionId]
    );
  };

  const handleDeselectRevision = (revisionId: string) => {
    setSelectedRevisions((prev) => prev.filter((id) => id !== revisionId));
  };

  const handleRestore = async () => {
    if (!restoreRevisionId) return;
    try {
      const revision = await getRevision(client, basePath, templateName, restoreRevisionId);
      if (revision) {
        await saveDraft.mutateAsync({
          name: templateName,
          culture,
          content: revision.content,
          mimeType: revision.mimeType,
        });
        toast.success(t('Templates.Messages.Saved'));
      }
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[TemplateHistory] Restore revision failed', err);
    }
    setRestoreRevisionId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!history?.revisions.length) {
    return <p className="text-sm text-muted-foreground">{t('Common.NoResults')}</p>;
  }

  const [firstRevision, secondRevision] = selectedRevisions;

  return (
    <div data-slot="template-history" className="space-y-4">
      {firstRevision && secondRevision && onCompare && (
        <Button variant="outline" onClick={() => onCompare(firstRevision, secondRevision)}>
          <GitCompareArrows className="mr-2 h-4 w-4" />
          {t('Templates.History.Compare')}
        </Button>
      )}

      <div className="relative space-y-0">
        {history.revisions.map((revision, index) => (
          <RevisionEntry
            key={revision.revisionId}
            revision={revision}
            isLast={index === history.revisions.length - 1}
            isSelected={selectedRevisions.includes(revision.revisionId)}
            onSelect={() => handleSelectRevision(revision.revisionId)}
            onDeselect={() => handleDeselectRevision(revision.revisionId)}
            onRestore={() => setRestoreRevisionId(revision.revisionId)}
            t={t}
            formatDateTime={formatDateTime}
          />
        ))}
      </div>

      <ConfirmActionDialog
        open={!!restoreRevisionId}
        onOpenChange={(open) => {
          if (!open) setRestoreRevisionId(null);
        }}
        title={t('Templates.History.Restore')}
        description={t('Templates.Confirm.Publish')}
        confirmLabel={t('Common.Confirm')}
        onConfirm={handleRestore}
      />
    </div>
  );
}

function RevisionEntry({
  revision,
  isLast,
  isSelected,
  onSelect,
  onDeselect,
  onRestore,
  t,
  formatDateTime,
}: Readonly<{
  revision: TemplateRevisionSummary;
  isLast: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onRestore: () => void;
  t: (key: string) => string;
  formatDateTime: (date: string | Date) => string;
}>) {
  const canRestore = revision.status === 'Archived' || revision.status === 'Published';

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => (checked ? onSelect() : onDeselect())}
          aria-label={`${t('Templates.History.Revision')} ${revision.revisionId.substring(0, 8)}`}
        />
        {!isLast && <div className="w-px flex-1 bg-border" />}
      </div>

      <div className="pb-6">
        <div className="flex items-center gap-2">
          <TemplateStatusBadge status={revision.status} />
          <span className="text-sm font-medium">{revision.createdBy}</span>
          <span className="text-xs text-muted-foreground">
            {formatDateTime(revision.createdAt)}
          </span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          <code>{revision.revisionId.substring(0, 8)}</code>
          {' · '}
          {revision.contentLength} chars
        </div>
        {revision.publishedAt && (
          <div className="mt-1 text-xs">
            {t('Templates.History.PublishedAt')}: {formatDateTime(revision.publishedAt)}
            {revision.publishedBy && ` · ${revision.publishedBy}`}
          </div>
        )}
        {canRestore && (
          <Button variant="ghost" size="sm" className="mt-1" onClick={onRestore}>
            <RotateCcw className="mr-1 h-3 w-3" />
            {t('Templates.History.Restore')}
          </Button>
        )}
      </div>
    </div>
  );
}
