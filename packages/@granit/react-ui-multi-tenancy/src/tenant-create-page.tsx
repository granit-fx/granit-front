import { useTranslation } from '@granit/react-localization';
import { TenantAdminProvider, useCreateTenant } from '@granit/react-multi-tenancy';
import { toast, Button, Separator } from '@granit/react-ui';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { TenantForm } from './components/tenant-form';

import type { CreateTenantFormValues } from './validation';

function TenantCreateContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createMutation = useCreateTenant();

  function handleSubmit(values: CreateTenantFormValues) {
    createMutation.mutate(
      {
        name: values.name,
        identifier: values.identifier,
        contactEmail: values.contactEmail || undefined,
        jurisdiction: values.jurisdiction || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t('Tenants.CreateSuccess'));
          navigate('/tenants');
        },
      }
    );
  }

  return (
    <div data-slot="tenant-create-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/tenants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('Tenants.Title')}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-2xl font-semibold text-foreground">{t('Tenants.CreateTitle')}</h2>
      </div>

      <TenantForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/tenants')}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}

export function TenantCreatePage() {
  return (
    <TenantAdminProvider config={{}}>
      <TenantCreateContent />
    </TenantAdminProvider>
  );
}
