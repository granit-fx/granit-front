import { usePermissions } from '@granit/react-authorization';
import { useTranslation } from '@granit/react-localization';
import {
  TenantAdminProvider,
  useActivateTenant,
  useDeactivateTenant,
  useTenantDetail,
  useUpdateTenant,
} from '@granit/react-multi-tenancy';
import { toast, Badge, Button, Separator } from '@granit/react-ui';
import { DetailAsideLayout, DetailAsideMobileTrigger } from '@granit/react-ui-kit';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Network } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { TenantForm } from './components/tenant-form';
import { TenantStatusDialog } from './components/tenant-status-dialog';

import type { EditTenantFormValues } from './validation';
import type * as React from 'react';

export interface TenantEditPageProps {
  /**
   * Renders the right-hand activity aside (e.g. an entity timeline). Host-owned:
   * the showcase supplies whatever activity feed it has for the tenant, wired to
   * its own auth context and `@`-mention picker. When omitted, the aside is empty.
   */
  readonly renderActivityAside?: (tenantId: string) => React.ReactNode;
  /** Title for the activity aside panel (defaults to the timeline title key). */
  readonly activityAsideTitle?: string;
}

function TenantEditContent({ renderActivityAside, activityAsideTitle }: TenantEditPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: tenant, isLoading } = useTenantDetail(id ?? '');
  const updateMutation = useUpdateTenant();
  const activateMutation = useActivateTenant();
  const deactivateMutation = useDeactivateTenant();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('MultiTenancy.Tenants.Manage');
  const canViewHostnames = hasPermission('Hostnames.Hostnames.Read');
  const queryClient = useQueryClient();

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  function handleSubmit(values: EditTenantFormValues) {
    if (!id || !tenant) return;

    updateMutation.mutate(
      {
        id,
        request: {
          name: values.name,
          concurrencyStamp: tenant.concurrencyStamp,
          contactEmail: values.contactEmail || undefined,
          jurisdiction: values.jurisdiction || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success(t('Tenants.SaveSuccess'));
          navigate('/tenants');
        },
      }
    );
  }

  function handleStatusConfirm() {
    if (!tenant) return;
    const mutation = tenant.activated ? deactivateMutation : activateMutation;
    const successKey = tenant.activated ? 'Tenants.DeactivateSuccess' : 'Tenants.ActivateSuccess';

    mutation.mutate(tenant.id, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ['api', 'v1', 'multi-tenancy', 'tenants'],
        });
        toast.success(t(successKey));
        setStatusDialogOpen(false);
      },
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">{t('Tenants.NotFound')}</div>
    );
  }

  return (
    <div data-slot="tenant-edit-page">
      <DetailAsideLayout
        asideTitle={activityAsideTitle ?? t('Timeline.Title')}
        aside={renderActivityAside?.(tenant.id)}
        header={
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/tenants">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('Tenants.Title')}
                </Link>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-foreground">{tenant.name}</h2>
                <Badge variant={tenant.activated ? 'default' : 'secondary'}>
                  {tenant.activated ? t('Tenants.Status.Active') : t('Tenants.Status.Inactive')}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canViewHostnames && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/hostnames?ownerType=tenant&ownerId=${id}`}>
                    <Network className="mr-2 h-4 w-4" />
                    {t('Tenants.CustomDomains')}
                  </Link>
                </Button>
              )}
              {canManage && (
                <Button
                  variant={tenant.activated ? 'destructive' : 'default'}
                  size="sm"
                  onClick={() => setStatusDialogOpen(true)}
                >
                  {tenant.activated
                    ? t('Tenants.Actions.Deactivate')
                    : t('Tenants.Actions.Activate')}
                </Button>
              )}
              <DetailAsideMobileTrigger />
            </div>
          </div>
        }
      >
        <TenantForm
          mode="edit"
          defaultValues={{
            name: tenant.name,
            contactEmail: tenant.contactEmail ?? '',
            jurisdiction: tenant.jurisdiction ?? '',
          }}
          readOnlyIdentifier={tenant.identifier}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/tenants')}
          isSubmitting={updateMutation.isPending}
        />
      </DetailAsideLayout>

      <TenantStatusDialog
        tenantName={tenant.name}
        action={tenant.activated ? 'deactivate' : 'activate'}
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        onConfirm={handleStatusConfirm}
        isPending={activateMutation.isPending || deactivateMutation.isPending}
      />
    </div>
  );
}

export function TenantEditPage(props: TenantEditPageProps) {
  return (
    <TenantAdminProvider config={{}}>
      <TenantEditContent {...props} />
    </TenantAdminProvider>
  );
}
