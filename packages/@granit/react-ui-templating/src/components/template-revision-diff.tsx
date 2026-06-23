import { useTranslation } from '@granit/react-localization';
import { useTemplateRevision } from '@granit/react-templating';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@granit/react-ui';
import { cn } from '@granit/utils';
import { diffLines } from 'diff';
import { useMemo } from 'react';

import type { Change } from 'diff';

interface TemplateRevisionDiffProps {
  templateName: string;
  leftRevisionId: string;
  rightRevisionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateRevisionDiff({
  templateName,
  leftRevisionId,
  rightRevisionId,
  open,
  onOpenChange,
}: Readonly<TemplateRevisionDiffProps>) {
  const { t } = useTranslation();

  const { data: left, isLoading: leftLoading } = useTemplateRevision(templateName, leftRevisionId);
  const { data: right, isLoading: rightLoading } = useTemplateRevision(
    templateName,
    rightRevisionId
  );

  const isLoading = leftLoading || rightLoading;

  const changes = useMemo(() => {
    if (!left?.content || !right?.content) return [];
    return diffLines(left.content, right.content);
  }, [left, right]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t('Templates.History.Compare')}</DialogTitle>
          <DialogDescription>
            <code>{leftRevisionId.substring(0, 8)}</code>
            {' ↔ '}
            <code>{rightRevisionId.substring(0, 8)}</code>
          </DialogDescription>
        </DialogHeader>

        <div
          data-slot="template-revision-diff"
          className="max-h-[60vh] overflow-auto rounded-md border font-mono text-sm"
        >
          <DiffContent isLoading={isLoading} changes={changes} t={t} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getDiffMarker(change: Change): string {
  if (change.added) return '+';
  if (change.removed) return '-';
  return ' ';
}

function DiffContent({
  isLoading,
  changes,
  t,
}: Readonly<{
  isLoading: boolean;
  changes: readonly Change[];
  t: (key: string) => string;
}>) {
  if (isLoading) {
    return (
      <div className="space-y-1 p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (changes.length === 0) {
    return <p className="p-4 text-muted-foreground">{t('Common.NoResults')}</p>;
  }

  return (
    <>
      {changes.map((change, i) => (
        <div
          key={`${getDiffMarker(change)}-${change.value.substring(0, 20)}-${i}`}
          className={cn(
            'whitespace-pre-wrap px-3 py-0.5',
            change.added && 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200',
            change.removed && 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200'
          )}
        >
          <span className="mr-2 select-none text-muted-foreground">{getDiffMarker(change)}</span>
          {change.value}
        </div>
      ))}
    </>
  );
}
