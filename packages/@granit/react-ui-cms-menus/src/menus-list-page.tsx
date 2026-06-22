import { useMenus, useDeleteMenu } from '@granit/react-cms';
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
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

export function MenusListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: siteId } = useParams<{ id: string }>();

  // Menu list is paginated via the query-engine surface (PaginationParams);
  // it is not filterable by siteId on the wire.
  const { data: menus, isLoading, isError } = useMenus();
  const deleteMenu = useDeleteMenu();

  function handleDelete(menuId: string) {
    deleteMenu.mutate(
      { id: menuId, siteId: siteId ?? '' },
      {
        onSuccess: () => {
          toast.success(t('cms:Menus.DeleteSuccess', 'Menu deleted.'));
        },
      }
    );
  }

  return (
    <div data-slot="menus-list-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/cms/sites">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('cms:Sites.Title', 'Sites')}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-2xl font-semibold text-foreground">{t('cms:Menus.Title', 'Menus')}</h2>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => navigate(`/cms/sites/${siteId}/menus/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('cms:Menus.NewMenu', 'New menu')}
        </Button>
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          {t('cms:Menus.LoadError', 'Failed to load menus.')}
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('cms:Menus.Columns.Key', 'Key')}</TableHead>
            <TableHead>{t('cms:Menus.Columns.Title', 'Title')}</TableHead>
            <TableHead>{t('cms:Menus.Columns.Items', 'Items')}</TableHead>
            <TableHead className="w-[100px]">{t('cms:Menus.Columns.Actions', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                {t('cms:Menus.Loading', 'Loading menus…')}
              </TableCell>
            </TableRow>
          )}
          {!isLoading && (!menus?.items || menus.items.length === 0) && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                {t('cms:Menus.Empty', 'No menus found.')}
              </TableCell>
            </TableRow>
          )}
          {menus?.items.map((menu) => (
            <TableRow key={menu.id}>
              <TableCell className="font-mono text-sm">{menu.key}</TableCell>
              <TableCell>{menu.title}</TableCell>
              <TableCell>{menu.items.length}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/cms/sites/${siteId}/menus/${menu.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
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
                          {t('cms:Menus.DeleteConfirm.Title', 'Delete menu?')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('cms:Menus.DeleteConfirm.Description', 'Delete menu "{{key}}"?', {
                            key: menu.key,
                          })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('cms:Common.Cancel', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(menu.id)}
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
