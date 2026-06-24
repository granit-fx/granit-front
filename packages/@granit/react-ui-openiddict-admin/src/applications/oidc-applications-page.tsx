import { openiddictConstraints, OpenIddictPermissions } from '@granit/openiddict-admin';
import { usePermissions } from '@granit/react-authorization';
import { useTranslation } from '@granit/react-localization';
import {
  useCreateOidcApplication,
  useDeleteOidcApplication,
  useOidcApplications,
  useUpdateOidcApplication,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Textarea,
  toast,
} from '@granit/react-ui';
import { EmptyState } from '@granit/react-ui-kit';
import {
  createConstraintsResolver,
  type ConstraintsResolver,
  type TranslateFunction,
} from '@granit/react-validation';
import { CheckCircle2, Loader2, Pencil, Plus, Shield, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useForm, type FieldValues, type Resolver } from 'react-hook-form';

import { logger } from '../logger';

import type { AdminOidcApplicationResponse } from '@granit/openiddict-admin';
import type { AxiosError } from '@granit/react-openiddict-admin';

const APPLICATION_TYPES = ['web', 'native'] as const;
const CONSENT_TYPES = ['implicit', 'explicit', 'external', 'systematic'] as const;
const CLIENT_SIDES = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Host' },
  { value: 2, label: 'Tenant' },
  { value: 3, label: 'Both' },
] as const;

// Spec-driven validation: required/maxLength constraints come from
// contracts/openapi/openiddict.json. The URI lists carry only the server-only
// `Validation:Format:AbsoluteUri` marker, which validateField intentionally
// skips — so the client-only per-item absolute-URI check (was `z.string().url()`)
// is reinstated below as an augmentation wrapping the spec baseResolver.
const URI_LIST_FIELDS = ['redirectUris', 'postLogoutRedirectUris'] as const;

/** Mirrors the old `z.string().url()` per-item guard: every entry must parse as an absolute URI. */
function isAbsoluteUri(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

interface CreateFormValues {
  readonly clientId: string;
  readonly clientSecret?: string;
  readonly displayName?: string;
  readonly type?: string | null;
  readonly permissions?: string[];
  readonly redirectUris?: string[];
  readonly postLogoutRedirectUris?: string[];
  readonly consentType?: string | null;
  readonly signingKeyJwk?: string;
  readonly clientSide?: number | null;
}

interface EditFormValues {
  readonly displayName?: string | null;
  readonly type?: string | null;
  readonly permissions?: string[] | null;
  readonly redirectUris?: string[] | null;
  readonly postLogoutRedirectUris?: string[] | null;
  readonly consentType?: string | null;
  readonly signingKeyJwk?: string | null;
  readonly clientSide?: number | null;
}

// The constraints expose camelCase field names; the i18n label keys are
// PascalCase (`OpenIddict.Applications.Fields.ClientId`). This bridges the two.
function applicationLabel(field: string): string {
  return field.charAt(0).toUpperCase() + field.slice(1);
}

/**
 * Wraps a spec-derived constraints resolver, re-adding the client-only per-item
 * absolute-URI check on the URI-list fields (lost when zod was dropped — the spec
 * carries only the server-side `Validation:Format:AbsoluteUri` marker).
 */
function withUriListValidation<TValues extends FieldValues>(
  baseResolver: Resolver<TValues>,
  t: TranslateFunction
): Resolver<TValues> {
  return (async (
    values: Record<string, unknown>,
    context: unknown,
    options: { fields: Record<string, { name: string }> }
  ) => {
    const result = await (baseResolver as unknown as ConstraintsResolver)(values, context, options);
    for (const fieldName of URI_LIST_FIELDS) {
      if (result.errors[fieldName]) continue;
      const list = values[fieldName];
      if (
        Array.isArray(list) &&
        list.some((uri) => typeof uri === 'string' && !isAbsoluteUri(uri))
      ) {
        result.errors[fieldName] = {
          type: 'url',
          message: t('OpenIddict.Applications.Fields.InvalidUri'),
        };
      }
    }
    return result;
  }) as unknown as Resolver<TValues>;
}

function parseLines(raw: string): string[] {
  return raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinLines(arr: string[] | null | undefined): string {
  return arr ? arr.join('\n') : '';
}

export function OidcApplicationsPage() {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(OpenIddictPermissions.Applications.Manage);

  const { data: applications, isLoading } = useOidcApplications();
  const createMutation = useCreateOidcApplication();
  const updateMutation = useUpdateOidcApplication();
  const deleteMutation = useDeleteOidcApplication();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminOidcApplicationResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminOidcApplicationResponse | null>(null);

  const createResolver = withUriListValidation(
    createConstraintsResolver(openiddictConstraints.AdminOidcCreateApplicationRequest, t, {
      labelResolver: (field) =>
        t(`OpenIddict.Applications.Fields.${applicationLabel(field)}`, field),
    }) as unknown as Resolver<CreateFormValues>,
    t
  );

  const editResolver = withUriListValidation(
    createConstraintsResolver(openiddictConstraints.AdminOidcUpdateApplicationRequest, t, {
      labelResolver: (field) =>
        t(`OpenIddict.Applications.Fields.${applicationLabel(field)}`, field),
    }) as unknown as Resolver<EditFormValues>,
    t
  );

  const createForm = useForm<CreateFormValues>({
    resolver: createResolver,
    defaultValues: {
      clientId: '',
      clientSecret: '',
      displayName: '',
      type: null,
      permissions: [],
      redirectUris: [],
      postLogoutRedirectUris: [],
      consentType: null,
      signingKeyJwk: '',
      clientSide: null,
    },
  });

  const editForm = useForm<EditFormValues>({
    resolver: editResolver,
    defaultValues: {
      displayName: '',
      type: '',
      permissions: [],
      redirectUris: [],
      postLogoutRedirectUris: [],
      consentType: null,
      signingKeyJwk: '',
      clientSide: null,
    },
  });

  const handleCreate = async (data: CreateFormValues) => {
    try {
      await createMutation.mutateAsync({
        clientId: data.clientId,
        clientSecret: data.clientSecret || undefined,
        displayName: data.displayName || undefined,
        type: data.type || undefined,
        permissions: data.permissions?.length ? data.permissions : undefined,
        redirectUris: data.redirectUris?.length ? data.redirectUris : undefined,
        postLogoutRedirectUris: data.postLogoutRedirectUris?.length
          ? data.postLogoutRedirectUris
          : undefined,
        consentType: data.consentType || undefined,
        signingKeyJwk: data.signingKeyJwk || undefined,
        clientSide: data.clientSide ?? undefined,
      });
      toast.success(t('OpenIddict.Applications.CreateSuccess'));
      setCreateOpen(false);
      createForm.reset();
    } catch (err) {
      logger.error('[OidcApplications] create failed', err);
      toast.error(t('OpenIddict.Applications.CreateError'));
    }
  };

  const openEdit = (app: AdminOidcApplicationResponse) => {
    setEditTarget(app);
    editForm.reset({
      displayName: app.displayName ?? '',
      type: app.type ?? '',
      permissions: app.permissions ?? [],
      redirectUris: app.redirectUris ?? [],
      postLogoutRedirectUris: app.postLogoutRedirectUris ?? [],
      consentType: app.consentType ?? null,
      signingKeyJwk: '',
      clientSide: app.clientSide ?? null,
    });
  };

  const handleEdit = async (data: EditFormValues) => {
    if (!editTarget?.clientId) return;
    try {
      await updateMutation.mutateAsync({
        clientId: editTarget.clientId,
        request: {
          displayName: data.displayName || null,
          type: data.type || null,
          permissions: data.permissions ?? null,
          redirectUris: data.redirectUris ?? null,
          postLogoutRedirectUris: data.postLogoutRedirectUris ?? null,
          consentType: data.consentType || null,
          signingKeyJwk: data.signingKeyJwk ?? null,
          clientSide: data.clientSide ?? null,
        },
      });
      toast.success(t('OpenIddict.Applications.EditSuccess'));
      setEditTarget(null);
    } catch (err) {
      const status = (err as AxiosError)?.response?.status;
      logger.error('[OidcApplications] update failed', err);
      toast.error(
        status === 404
          ? t('OpenIddict.Applications.NotFound')
          : t('OpenIddict.Applications.EditError')
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.clientId) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.clientId);
      toast.success(t('OpenIddict.Applications.DeleteSuccess'));
      setDeleteTarget(null);
    } catch (err) {
      logger.error('[OidcApplications] delete failed', err);
      toast.error(t('OpenIddict.Applications.DeleteError'));
    }
  };

  return (
    <div data-slot="oidc-applications-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('OpenIddict.Applications.Title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('OpenIddict.Applications.Description')}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 size-4" />
            {t('OpenIddict.Applications.Create')}
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      )}

      {!isLoading && applications && applications.length > 0 && (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">
                  {t('OpenIddict.Applications.Columns.ClientId')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('OpenIddict.Applications.Columns.DisplayName')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('OpenIddict.Applications.Columns.Type')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('OpenIddict.Applications.Columns.Permissions')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('OpenIddict.Applications.Columns.RedirectUris')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('OpenIddict.Applications.Columns.SigningKey')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('OpenIddict.Applications.Columns.TenantId')}
                </th>
                {canManage && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.clientId} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{app.clientId ?? '—'}</td>
                  <td className="px-4 py-3">{app.displayName ?? '—'}</td>
                  <td className="px-4 py-3">{app.type ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {app.permissions?.length
                      ? t('OpenIddict.Applications.PermissionCount', {
                          count: app.permissions.length,
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {app.redirectUris?.length
                      ? t('OpenIddict.Applications.UriCount', { count: app.redirectUris.length })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {app.hasSigningKey ? (
                      <CheckCircle2
                        className="size-4 text-success-600 dark:text-success-500"
                        aria-label={t('OpenIddict.Applications.HasSigningKey')}
                      />
                    ) : (
                      <XCircle
                        className="size-4 text-muted-foreground"
                        aria-label={t('OpenIddict.Applications.NoSigningKey')}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{app.tenantId ?? '—'}</td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(app)}
                          aria-label={t('OpenIddict.Applications.Edit')}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(app)}
                          aria-label={t('OpenIddict.Applications.Delete')}
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

      {!isLoading && (!applications || applications.length === 0) && (
        <EmptyState icon={Shield} message={t('OpenIddict.Applications.Empty')} />
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => !open && setCreateOpen(false)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('OpenIddict.Applications.CreateTitle')}</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Applications.Fields.ClientId')}</FormLabel>
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
                    <FormLabel>{t('OpenIddict.Applications.Fields.DisplayName')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Applications.Fields.Type')}</FormLabel>
                    <Select
                      value={field.value ?? ''}
                      onValueChange={(v) => field.onChange(v === '__none' ? null : v)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none">—</SelectItem>
                        {APPLICATION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`OpenIddict.Applications.Types.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="clientSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Applications.Fields.ClientSecret')}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="consentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Applications.Fields.ConsentType')}</FormLabel>
                    <Select
                      value={field.value ?? ''}
                      onValueChange={(v) => field.onChange(v === '__none' ? null : v)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none">—</SelectItem>
                        {CONSENT_TYPES.map((ct) => (
                          <SelectItem key={ct} value={ct}>
                            {t(`OpenIddict.Applications.ConsentTypes.${ct}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="clientSide"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Applications.Fields.ClientSide')}</FormLabel>
                    <Select
                      value={field.value == null ? '' : String(field.value)}
                      onValueChange={(v) => field.onChange(v === '__none' ? null : Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none">—</SelectItem>
                        {CLIENT_SIDES.map(({ value, label }) => (
                          <SelectItem key={value} value={String(value)}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="redirectUris"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Applications.Fields.RedirectUris')}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        value={joinLines(field.value)}
                        onChange={(e) => field.onChange(parseLines(e.target.value))}
                        placeholder={t('OpenIddict.Applications.Fields.UrisPlaceholder')}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('OpenIddict.Applications.Fields.UrisHint')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="postLogoutRedirectUris"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('OpenIddict.Applications.Fields.PostLogoutRedirectUris')}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        value={joinLines(field.value)}
                        onChange={(e) => field.onChange(parseLines(e.target.value))}
                        placeholder={t('OpenIddict.Applications.Fields.UrisPlaceholder')}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('OpenIddict.Applications.Fields.UrisHint')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Applications.Fields.Permissions')}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        value={joinLines(field.value)}
                        onChange={(e) => field.onChange(parseLines(e.target.value))}
                        placeholder={t('OpenIddict.Applications.Fields.PermissionsPlaceholder')}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('OpenIddict.Applications.Fields.PermissionsHint')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="signingKeyJwk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Applications.Fields.SigningKeyJwk')}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        {...field}
                        placeholder={t('OpenIddict.Applications.Fields.SigningKeyJwkPlaceholder')}
                      />
                    </FormControl>
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
                  {t('OpenIddict.Applications.Create')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('OpenIddict.Applications.EditTitle')}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                <span className="text-muted-foreground">
                  {t('OpenIddict.Applications.Fields.ClientId')}:{' '}
                </span>
                <span className="font-mono">{editTarget?.clientId}</span>
              </div>
              <FormField
                control={editForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Applications.Fields.DisplayName')}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Applications.Fields.Type')}</FormLabel>
                    <Select
                      value={field.value ?? ''}
                      onValueChange={(v) => field.onChange(v === '__none' ? null : v)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none">—</SelectItem>
                        {APPLICATION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`OpenIddict.Applications.Types.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="consentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Applications.Fields.ConsentType')}</FormLabel>
                    <Select
                      value={field.value ?? ''}
                      onValueChange={(v) => field.onChange(v === '__none' ? null : v)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none">—</SelectItem>
                        {CONSENT_TYPES.map((ct) => (
                          <SelectItem key={ct} value={ct}>
                            {t(`OpenIddict.Applications.ConsentTypes.${ct}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="clientSide"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Applications.Fields.ClientSide')}</FormLabel>
                    <Select
                      value={field.value == null ? '' : String(field.value)}
                      onValueChange={(v) => field.onChange(v === '__none' ? null : Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none">—</SelectItem>
                        {CLIENT_SIDES.map(({ value, label }) => (
                          <SelectItem key={value} value={String(value)}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="redirectUris"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Applications.Fields.RedirectUris')}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        value={joinLines(field.value)}
                        onChange={(e) => field.onChange(parseLines(e.target.value))}
                        placeholder={t('OpenIddict.Applications.Fields.UrisPlaceholder')}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('OpenIddict.Applications.Fields.UrisHint')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="postLogoutRedirectUris"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('OpenIddict.Applications.Fields.PostLogoutRedirectUris')}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        value={joinLines(field.value)}
                        onChange={(e) => field.onChange(parseLines(e.target.value))}
                        placeholder={t('OpenIddict.Applications.Fields.UrisPlaceholder')}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('OpenIddict.Applications.Fields.UrisHint')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Applications.Fields.Permissions')}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        value={joinLines(field.value)}
                        onChange={(e) => field.onChange(parseLines(e.target.value))}
                        placeholder={t('OpenIddict.Applications.Fields.PermissionsPlaceholder')}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('OpenIddict.Applications.Fields.PermissionsHint')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="signingKeyJwk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('OpenIddict.Applications.Fields.SigningKeyJwk')}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        {...field}
                        value={field.value ?? ''}
                        placeholder={t(
                          'OpenIddict.Applications.Fields.SigningKeyJwkEditPlaceholder'
                        )}
                      />
                    </FormControl>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('OpenIddict.Applications.DeleteTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('OpenIddict.Applications.DeleteConfirm', {
              clientId: deleteTarget?.clientId ?? '',
            })}
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
              {t('OpenIddict.Applications.Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
