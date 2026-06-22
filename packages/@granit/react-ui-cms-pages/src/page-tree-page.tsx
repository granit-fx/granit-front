import { usePageTree, useDeletePage } from '@granit/react-cms';
import { useTranslation } from '@granit/react-localization';
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
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

export function PageTreePage() {
  const { t } = useTranslation();
  const { id: siteId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const effectiveSiteId = siteId ?? searchParams.get('siteId') ?? '';

  const { data: pages, isLoading, isError } = usePageTree(effectiveSiteId);
  const deletePage = useDeletePage();

  function handleDelete(pageId: string) {
    deletePage.mutate(
      { id: pageId, siteId: effectiveSiteId },
      {
        onSuccess: () => {
          toast.success(t('cms:Pages.DeleteSuccess', 'Page deleted.'));
        },
      }
    );
  }

  return (
    <div data-slot="page-tree-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/cms/sites">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('cms:Sites.Title', 'Sites')}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-2xl font-semibold text-foreground">{t('cms:Pages.Title', 'Pages')}</h2>
      </div>

      <div className="flex justify-end">
        <Button asChild>
          <Link to={`/cms/sites/${effectiveSiteId}/pages/new`}>
            <Plus className="mr-2 h-4 w-4" />
            {t('cms:Pages.NewPage', 'New page')}
          </Link>
        </Button>
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          {t('cms:Pages.LoadError', 'Failed to load pages.')}
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('cms:Pages.Columns.Path', 'Path')}</TableHead>
            <TableHead>{t('cms:Pages.Columns.Depth', 'Depth')}</TableHead>
            <TableHead className="w-[120px]">{t('cms:Pages.Columns.Actions', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                {t('cms:Pages.Loading', 'Loading pages…')}
              </TableCell>
            </TableRow>
          )}
          {!isLoading && (!pages || pages.length === 0) && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                {t('cms:Pages.Empty', 'No pages found.')}
              </TableCell>
            </TableRow>
          )}
          {pages?.map((page) => (
            <TableRow key={page.id}>
              <TableCell
                className="font-mono text-sm"
                style={{ paddingLeft: `${(page.depth + 1) * 16}px` }}
              >
                {page.structurePath}
              </TableCell>
              <TableCell className="text-muted-foreground">{page.depth}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link
                      to={`/cms/sites/${effectiveSiteId}/pages/${page.id}/edit`}
                      title={t('cms:Common.Edit', 'Edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={t('cms:Common.Delete', 'Delete')}
                        disabled={page.isSiteRoot}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t('cms:Pages.DeleteConfirm.Title', 'Delete page?')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t(
                            'cms:Pages.DeleteConfirm.Description',
                            'Delete "{{path}}" and all its children?',
                            { path: page.structurePath }
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('cms:Common.Cancel', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(page.id)}
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
    </div>
  );
}
