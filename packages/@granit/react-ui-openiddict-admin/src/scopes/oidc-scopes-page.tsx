import { openiddictConstraints, OpenIddictPermissions } from '@granit/openiddict-admin';
import { usePermissions } from '@granit/react-authorization';
import { useTranslation } from '@granit/react-localization';
import {
  useCreateOidcScope,
  useDeleteOidcScope,
  useOidcScopes,
  useUpdateOidcScope,
} from '@granit/react-openiddict-admin';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Spinner,
  Textarea,
  toast,
} from '@granit/react-ui';
import { EmptyState, TablePagination } from '@granit/react-ui-kit';
import { createConstraintsResolver } from '@granit/react-validation';
import { Layers, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';

import { logger } from '../logger';
import { PAGE_SIZE_OPTIONS, shouldPaginate, usePageState } from '../pagination';

import type { AdminOidcScopeResponse } from '@granit/openiddict-admin';
import type { AxiosError } from '@granit/react-openiddict-admin';

// Spec-driven validation: constraints (required/maxLength) are derived from
// contracts/openapi/openiddict.json. The scope forms carry no client-only rule —
// `resources` is an array with no per-item check — so the bare baseResolver is used.
interface CreateFormValues {
  readonly name: string;
  readonly displayName?: string;
  readonly description?: string;
  readonly resources?: string[];
}

interface EditFormValues {
  readonly displayName?: string | null;
  readonly description?: string | null;
  readonly resources?: string[] | null;
}

// The constraints expose camelCase field names; the i18n label keys are
// PascalCase (`OpenIddict.Scopes.Fields.Name`). This bridges the two.
function scopeLabel(field: string): string {
  return field.charAt(0).toUpperCase() + field.slice(1);
}

export function OidcScopesPage() {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(OpenIddictPermissions.Scopes.Manage);

  const { page, pageSize, setPage, setPageSize, onRowsRemoved } = usePageState();
  const { data: scopesPage, isLoading } = useOidcScopes({ page, pageSize });
  const scopes = scopesPage?.items;
  const createMutation = useCreateOidcScope();
  const updateMutation = useUpdateOidcScope();
  const deleteMutation = useDeleteOidcScope();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminOidcScopeResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminOidcScopeResponse | null>(null);

  const createResolver = createConstraintsResolver(
    openiddictConstraints.AdminOidcCreateScopeRequest,
    t,
    { labelResolver: (field) => t(`OpenIddict.Scopes.Fields.${scopeLabel(field)}`, field) }
  ) as unknown as Resolver<CreateFormValues>;

  const editResolver = createConstraintsResolver(
    openiddictConstraints.AdminOidcUpdateScopeRequest,
    t,
    { labelResolver: (field) => t(`OpenIddict.Scopes.Fields.${scopeLabel(field)}`, field) }
  ) as unknown as Resolver<EditFormValues>;

  const createForm = useForm<CreateFormValues>({
    resolver: createResolver,
    defaultValues: { name: '', displayName: '', description: '', resources: [] },
  });

  const editForm = useForm<EditFormValues>({
    resolver: editResolver,
    defaultValues: { displayName: '', description: '', resources: [] },
  });

  const handleCreate = async (data: CreateFormValues) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        displayName: data.displayName || undefined,
        description: data.description || undefined,
        resources: data.resources?.length ? data.resources : undefined,
      });
      toast.success(t('OpenIddict.Scopes.CreateSuccess'));
      setCreateOpen(false);
      createForm.reset();
    } catch (err) {
      logger.error('[OidcScopes] create failed', err);
      toast.error(t('OpenIddict.Scopes.CreateError'));
    }
  };

  const openEdit = (scope: AdminOidcScopeResponse) => {
    setEditTarget(scope);
    editForm.reset({
      displayName: scope.displayName ?? '',
      description: scope.description ?? '',
      resources: scope.resources ? [...scope.resources] : [],
    });
  };

  const handleEdit = async (data: EditFormValues) => {
    if (!editTarget?.name) return;
    try {
      await updateMutation.mutateAsync({
        scopeName: editTarget.name,
        request: {
          displayName: data.displayName || null,
          description: data.description || null,
          resources: data.resources ?? null,
        },
      });
      toast.success(t('OpenIddict.Scopes.EditSuccess'));
      setEditTarget(null);
    } catch (err) {
      const status = (err as AxiosError)?.response?.status;
      logger.error('[OidcScopes] update failed', err);
      toast.error(
        status === 404 ? t('OpenIddict.Scopes.NotFound') : t('OpenIddict.Scopes.EditError')
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.name) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.name);
      toast.success(t('OpenIddict.Scopes.DeleteSuccess'));
      setDeleteTarget(null);
      onRowsRemoved((scopes?.length ?? 1) - 1);
    } catch (err) {
      logger.error('[OidcScopes] delete failed', err);
      toast.error(t('OpenIddict.Scopes.DeleteError'));
    }
  };

  return (
    <div data-slot="oidc-scopes-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('OpenIddict.Scopes.Title')}</h2>
          <p className="text-sm text-muted-foreground">{t('OpenIddict.Scopes.Description')}</p>
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 size-4" />
            {t('OpenIddict.Scopes.Create')}
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      )}

      {!isLoading && scopes && scopes.length > 0 && (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">
                  {t('OpenIddict.Scopes.Columns.Name')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('OpenIddict.Scopes.Columns.DisplayName')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('OpenIddict.Scopes.Columns.Description')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('OpenIddict.Scopes.Columns.Resources')}
                </th>
                {canManage && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {scopes.map((scope) => (
                <tr key={scope.name} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{scope.name ?? '—'}</td>
                  <td className="px-4 py-3">{scope.displayName ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{scope.description ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {scope.resources?.length
                      ? t('OpenIddict.Scopes.ResourceCount', { count: scope.resources.length })
                      : '—'}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(scope)}
                          aria-label={t('OpenIddict.Scopes.Edit')}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(scope)}
                          aria-label={t('OpenIddict.Scopes.Delete')}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && shouldPaginate(scopesPage, pageSize) && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalCount={scopesPage?.totalCount ?? 0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />
      )}

      {!isLoading && (!scopes || scopes.length === 0) && (
        <EmptyState icon={Layers} message={t('OpenIddict.Scopes.Empty')} />
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => !open && setCreateOpen(false)}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t('OpenIddict.Scopes.CreateTitle')}</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Scopes.Fields.Name')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Scopes.Fields.DisplayName')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Scopes.Fields.Description')}</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="resources"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Scopes.Fields.Resources')}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        value={field.value ? field.value.join('\n') : ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              .split('\n')
                              .map((s) => s.trim())
                              .filter(Boolean)
                          )
                        }
                        placeholder={t('OpenIddict.Scopes.Fields.ResourcesPlaceholder')}
                      />
                    </FormControl>
                    <FormDescription>{t('OpenIddict.Scopes.Fields.ResourcesHint')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  disabled={createMutation.isPending}
                >
                  {t('Common.Cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-1 size-3.5 animate-spin" />}
                  {t('OpenIddict.Scopes.Create')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t('OpenIddict.Scopes.EditTitle')}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Scopes.Fields.DisplayName')}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Scopes.Fields.Description')}</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="resources"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Scopes.Fields.Resources')}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        value={field.value ? field.value.join('\n') : ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              .split('\n')
                              .map((s) => s.trim())
                              .filter(Boolean)
                          )
                        }
                        placeholder={t('OpenIddict.Scopes.Fields.ResourcesPlaceholder')}
                      />
                    </FormControl>
                    <FormDescription>{t('OpenIddict.Scopes.Fields.ResourcesHint')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditTarget(null)}
                  disabled={updateMutation.isPending}
                >
                  {t('Common.Cancel')}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-1 size-3.5 animate-spin" />}
                  {t('Common.Save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t('OpenIddict.Scopes.DeleteTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('OpenIddict.Scopes.DeleteConfirm', { name: deleteTarget?.name ?? '' })}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              {t('Common.Cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-1 size-3.5 animate-spin" />}
              {t('OpenIddict.Scopes.Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
