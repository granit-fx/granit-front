import { usePublishRelease, useReleases } from '@granit/react-cms';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  Badge,
  Button,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';
import { ArrowLeft, Eye, Plus, Send } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { ReleaseFormDialog } from './components/release-form-dialog';

import type { ReleaseStatus } from '@granit/cms';

function ReleaseBadge({ status }: { readonly status: ReleaseStatus }) {
  const { t } = useTranslation();
  const variantMap: Record<ReleaseStatus, 'secondary' | 'default' | 'outline' | 'destructive'> = {
    Draft: 'secondary',
    Ready: 'default',
    Running: 'default',
    Done: 'outline',
    Failed: 'destructive',
  };
  const labelMap: Record<ReleaseStatus, string> = {
    Draft: t('cms:Releases.Status.Draft', 'Draft'),
    Ready: t('cms:Releases.Status.Ready', 'Ready'),
    Running: t('cms:Releases.Status.Running', 'Running'),
    Done: t('cms:Releases.Status.Done', 'Done'),
    Failed: t('cms:Releases.Status.Failed', 'Failed'),
  };
  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
}

export function ReleasesListPage() {
  const { t } = useTranslation();
  const { formatDate } = useDateFormatter();
  const navigate = useNavigate();
  const { id: siteId } = useParams<{ id: string }>();
  const [createOpen, setCreateOpen] = useState(false);

  // Release list is paginated via the query-engine surface (PaginationParams);
  // it is not filterable by siteId on the wire. Releases are cancelled (in the
  // detail page), never deleted — the backend exposes no DELETE endpoint.
  const { data: releases, isLoading, isError } = useReleases();
  const publishRelease = usePublishRelease();

  function handlePublish(releaseId: string, name: string) {
    publishRelease.mutate(releaseId, {
      onSuccess: () => {
        toast.success(t('cms:Releases.PublishSuccess', 'Release "{{name}}" published.', { name }));
      },
    });
  }

  return (
    <div data-slot="releases-list-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/cms/sites">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('cms:Sites.Title', 'Sites')}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-2xl font-semibold text-foreground">
          {t('cms:Releases.Title', 'Releases')}
        </h2>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('cms:Releases.NewRelease', 'New release')}
        </Button>
      </div>

      <ReleaseFormDialog open={createOpen} onOpenChange={setCreateOpen} siteId={siteId ?? ''} />

      {isError && (
        <p className="text-sm text-destructive">
          {t('cms:Releases.LoadError', 'Failed to load releases.')}
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('cms:Releases.Columns.Name', 'Name')}</TableHead>
            <TableHead>{t('cms:Releases.Columns.Status', 'Status')}</TableHead>
            <TableHead>{t('cms:Releases.Columns.Schedule', 'Schedule')}</TableHead>
            <TableHead>{t('cms:Releases.Columns.Actions', 'Actions')}</TableHead>
            <TableHead className="w-[130px]">{t('cms:Common.Actions', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {t('cms:Releases.Loading', 'Loading releases…')}
              </TableCell>
            </TableRow>
          )}
          {!isLoading && (!releases?.items || releases.items.length === 0) && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {t('cms:Releases.Empty', 'No releases found.')}
              </TableCell>
            </TableRow>
          )}
          {releases?.items?.map((release) => (
            <TableRow key={release.id}>
              <TableCell className="font-medium">{release.name}</TableCell>
              <TableCell>
                <ReleaseBadge status={release.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {release.schedule?.scheduledAtUtc
                  ? formatDate(release.schedule.scheduledAtUtc)
                  : '—'}
              </TableCell>
              <TableCell>{release.actions.length}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/cms/sites/${siteId}/releases/${release.id}`)}
                    title={t('cms:Releases.Actions.View', 'View')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {release.status === 'Ready' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePublish(release.id, release.name)}
                      title={t('cms:Releases.Actions.Publish', 'Publish')}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
