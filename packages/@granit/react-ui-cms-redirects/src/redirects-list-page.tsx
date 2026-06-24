import { useRedirects, useDeleteRedirect, useUpdateRedirect } from '@granit/react-cms-redirects';
import { useTranslation } from '@granit/react-localization';
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@granit/react-ui';
import { ArrowLeft, Pencil, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { RedirectFormDialog } from './components/redirect-form-dialog';

import type { RedirectResponse } from '@granit/react-cms-redirects';

export function RedirectsListPage() {
  const { t } = useTranslation();
  const { id: siteId } = useParams<{ id: string }>();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RedirectResponse | null>(null);

  const { data: redirects, isLoading, isError } = useRedirects(siteId ?? '');
  const deleteRedirect = useDeleteRedirect();
  const updateRedirect = useUpdateRedirect();

  function handleDelete(id: string) {
    deleteRedirect.mutate(
      { id, siteId: siteId ?? '' },
      {
        onSuccess: () => toast.success(t('cms:Redirects.DeleteSuccess', 'Redirect deleted.')),
      }
    );
  }

  function handleToggle(redirect: RedirectResponse) {
    updateRedirect.mutate(
      {
        id: redirect.id,
        request: {
          target: redirect.target,
          type: redirect.type,
          matchType: redirect.matchType,
          isActive: !redirect.isActive,
        },
      },
      {
        onSuccess: () => toast.success(t('cms:Redirects.ToggleSuccess', 'Redirect updated.')),
      }
    );
  }

  return (
    <div data-slot="redirects-list-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/cms/sites">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('cms:Sites.Title', 'Sites')}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-2xl font-semibold text-foreground">
          {t('cms:Redirects.Title', 'Redirects')}
        </h2>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('cms:Redirects.NewRedirect', 'New redirect')}
        </Button>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {t('cms:Redirects.LoadError', 'Failed to load redirects.')}
          </AlertDescription>
        </Alert>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('cms:Redirects.Columns.Source', 'Source')}</TableHead>
            <TableHead>{t('cms:Redirects.Columns.Target', 'Target')}</TableHead>
            <TableHead>{t('cms:Redirects.Columns.MatchType', 'Match')}</TableHead>
            <TableHead>{t('cms:Redirects.Columns.Type', 'Type')}</TableHead>
            <TableHead>{t('cms:Redirects.Columns.Culture', 'Culture')}</TableHead>
            <TableHead>{t('cms:Redirects.Columns.StatusCode', 'Code')}</TableHead>
            <TableHead className="text-right">{t('cms:Redirects.Columns.Hits', 'Hits')}</TableHead>
            <TableHead>{t('cms:Redirects.Columns.Active', 'Active')}</TableHead>
            <TableHead className="w-[120px]">{t('cms:Common.Actions', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                {t('cms:Redirects.Loading', 'Loading redirects…')}
              </TableCell>
            </TableRow>
          )}
          {!isLoading && (!redirects || redirects.length === 0) && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                {t('cms:Redirects.Empty', 'No redirects found.')}
              </TableCell>
            </TableRow>
          )}
          {redirects?.map((redirect) => (
            <TableRow key={redirect.id}>
              <TableCell className="font-mono text-sm">{redirect.source}</TableCell>
              <TableCell className="font-mono text-sm">{redirect.target}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {t(`cms:Redirects.MatchType.${redirect.matchType}`, redirect.matchType)}
                </Badge>
              </TableCell>
              <TableCell>{t(`cms:Redirects.Type.${redirect.type}`, redirect.type)}</TableCell>
              <TableCell>{redirect.culture ?? '—'}</TableCell>
              <TableCell>{redirect.statusCode}</TableCell>
              <TableCell className="text-right tabular-nums">{redirect.hitCount}</TableCell>
              <TableCell>
                <Badge variant={redirect.isActive ? 'default' : 'secondary'}>
                  {redirect.isActive
                    ? t('cms:Common.Enabled', 'Enabled')
                    : t('cms:Common.Disabled', 'Disabled')}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(redirect);
                      setFormOpen(true);
                    }}
                    title={t('cms:Common.Edit', 'Edit')}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(redirect)}
                    title={
                      redirect.isActive
                        ? t('cms:Common.Disable', 'Disable')
                        : t('cms:Common.Enable', 'Enable')
                    }
                  >
                    {redirect.isActive ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t('cms:Redirects.DeleteConfirm.Title', 'Delete redirect?')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t(
                            'cms:Redirects.DeleteConfirm.Description',
                            'Delete redirect from "{{path}}"?',
                            { path: redirect.source }
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('cms:Common.Cancel', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(redirect.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('cms:Common.Delete', 'Delete')}
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

      <RedirectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        siteId={siteId ?? ''}
        redirect={editing}
      />
    </div>
  );
}
