import { useSites, useDeleteSite } from '@granit/react-cms';
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
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@granit/react-ui';
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  Menu,
  Tag,
  Search,
  Waypoints,
  Network,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function SitesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useSites();
  const deleteSite = useDeleteSite();

  function handleDelete(id: string) {
    deleteSite.mutate(id, {
      onSuccess: () => {
        toast.success(t('cms:Sites.DeleteSuccess', 'Site deleted.'));
      },
    });
  }

  return (
    <div data-slot="sites-list-page" className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('cms:Sites.Title', 'Sites')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('cms:Sites.Subtitle', 'Manage your CMS sites and their content.')}
          </p>
        </div>
        <Button asChild>
          <Link to="/cms/sites/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('cms:Sites.NewSite', 'New site')}
          </Link>
        </Button>
      </header>

      {isError && (
        <p className="text-sm text-destructive">
          {t('cms:Sites.LoadError', 'Failed to load sites.')}
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('cms:Sites.Columns.Slug', 'Slug')}</TableHead>
            <TableHead>{t('cms:Sites.Columns.Name', 'Name')}</TableHead>
            <TableHead>{t('cms:Sites.Columns.Cultures', 'Cultures')}</TableHead>
            <TableHead>{t('cms:Sites.Columns.Status', 'Status')}</TableHead>
            <TableHead className="w-[180px]">{t('cms:Sites.Columns.Actions', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {t('cms:Sites.Loading', 'Loading sites…')}
              </TableCell>
            </TableRow>
          )}
          {!isLoading && (!data?.items || data.items.length === 0) && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {t('cms:Sites.Empty', 'No sites found.')}
              </TableCell>
            </TableRow>
          )}
          {data?.items?.map((site) => (
            <TableRow key={site.id}>
              <TableCell className="font-mono text-sm">{site.slug}</TableCell>
              <TableCell>{site.displayNames?.[site.defaultCulture] ?? site.slug}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {site.allowedCultures.map((culture) => (
                    <Badge key={culture} variant="secondary" className="font-mono text-xs">
                      {culture}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={site.activated ? 'default' : 'secondary'}>
                  {site.activated
                    ? t('cms:Sites.Status.Active', 'Active')
                    : t('cms:Sites.Status.Inactive', 'Inactive')}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/cms/sites/${site.id}/pages`)}
                    title={t('cms:Sites.Actions.Pages', 'Pages')}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/cms/sites/${site.id}/menus`)}
                    title={t('cms:Sites.Actions.Menus', 'Menus')}
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/cms/sites/${site.id}/releases`)}
                    title={t('cms:Sites.Actions.Releases', 'Releases')}
                  >
                    <Tag className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/cms/sites/${site.id}/seo`)}
                    title={t('cms:Sites.Actions.Seo', 'SEO')}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/cms/sites/${site.id}/redirects`)}
                    title={t('cms:Sites.Actions.Redirects', 'Redirects')}
                  >
                    <Waypoints className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/cms/sites/${site.id}/hostnames`)}
                    title={t('cms:Sites.Actions.Hostnames', 'Hostnames')}
                  >
                    <Network className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    title={t('cms:Sites.Actions.Edit', 'Edit')}
                  >
                    <Link to={`/cms/sites/${site.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={t('cms:Sites.Actions.Delete', 'Delete')}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t('cms:Sites.DeleteConfirm.Title', 'Delete site?')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t(
                            'cms:Sites.DeleteConfirm.Description',
                            'This will permanently delete "{{slug}}" and all its content.',
                            { slug: site.slug }
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('cms:Common.Cancel', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(site.id)}
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
