import {
  useRemoveSiteHostname,
  useSiteHostnames,
  useVerifySiteHostname,
} from '@granit/react-cms-hostnames';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';
import { ArrowLeft, RefreshCw, Star, Trash2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { CmsHostnameAddForm } from './components/cms-hostname-add-form';
import { CmsHostnameStatusBadge } from './components/cms-hostname-status-badge';

import type { SiteHostnameResponse } from '@granit/react-cms-hostnames';

export function HostnamesPage() {
  const { t } = useTranslation();
  const { formatDate } = useDateFormatter();
  const { id: siteId } = useParams<{ id: string }>();
  const effectiveSiteId = siteId ?? '';

  const { data: hostnames, isLoading, isError } = useSiteHostnames(effectiveSiteId);
  const removeHostname = useRemoveSiteHostname(effectiveSiteId);
  const verifyHostname = useVerifySiteHostname(effectiveSiteId);

  function handleRemove(hostname: SiteHostnameResponse) {
    removeHostname.mutate(hostname.id, {
      onSuccess: () => toast.success(t('cms:Hostnames.RemoveSuccess', 'Hostname removed.')),
    });
  }

  function handleVerify(hostname: SiteHostnameResponse) {
    verifyHostname.mutate(hostname.id, {
      onSuccess: () => toast.success(t('cms:Hostnames.VerifySuccess', 'Verification triggered.')),
    });
  }

  return (
    <div data-slot="hostnames-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/cms/sites">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('cms:Sites.Title', 'Sites')}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-2xl font-semibold text-foreground">
          {t('cms:Hostnames.Title', 'Hostnames')}
        </h2>
      </div>

      <CmsHostnameAddForm siteId={effectiveSiteId} />

      {isError && (
        <p className="text-sm text-destructive">
          {t('cms:Hostnames.LoadError', 'Failed to load hostnames.')}
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('cms:Hostnames.Columns.Host', 'Host')}</TableHead>
            <TableHead>{t('cms:Hostnames.Columns.Status', 'Status')}</TableHead>
            <TableHead>{t('cms:Hostnames.Columns.Primary', 'Primary')}</TableHead>
            <TableHead>{t('cms:Hostnames.Columns.LastVerified', 'Last verified')}</TableHead>
            <TableHead className="w-[120px]">{t('cms:Common.Actions', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {t('cms:Hostnames.Loading', 'Loading hostnames…')}
              </TableCell>
            </TableRow>
          )}
          {!isLoading && (!hostnames || hostnames.length === 0) && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {t('cms:Hostnames.Empty', 'No hostnames configured.')}
              </TableCell>
            </TableRow>
          )}
          {hostnames?.map((hostname) => (
            <TableRow key={hostname.id}>
              <TableCell className="font-mono">{hostname.host}</TableCell>
              <TableCell>
                <CmsHostnameStatusBadge status={hostname.status} />
              </TableCell>
              <TableCell>
                {hostname.isPrimary && (
                  <Star className="h-4 w-4 fill-warning-500 text-warning-500" />
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {hostname.lastCheckedAt ? formatDate(hostname.lastCheckedAt) : '—'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {/* Primary is chosen at creation (SiteHostnameCreateRequest.isPrimary);
                      the CMS backend exposes no set-primary endpoint. */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVerify(hostname)}
                    title={t('cms:Hostnames.Actions.VerifyNow', 'Verify now')}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={hostname.isPrimary}
                        title={t('cms:Hostnames.Actions.Remove', 'Remove')}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t('cms:Hostnames.RemoveConfirm.Title', 'Remove hostname?')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t(
                            'cms:Hostnames.RemoveConfirm.Description',
                            'Remove "{{host}}" from this site?',
                            { host: hostname.host }
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('cms:Common.Cancel', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemove(hostname)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('cms:Common.Remove', 'Remove')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
