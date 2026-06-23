import { useGranitClient } from '@granit/react-api-client';
import {
  EntityForm,
  useEntityDiscovery,
  useEntityForm,
  useEntityMetadata,
} from '@granit/react-entities';
import { useTranslation } from '@granit/react-localization';
import { Button, Skeleton } from '@granit/react-ui';
import { resolveLabel } from '@granit/react-localization';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { CollectionSectionCard } from './collection-section-card';
import { EntityPageLayout } from './entity-page-layout';
import { asExtended } from './manifest-extensions';

// Wire convention is camelCase JSON, manifest uses PascalCase. Use lower-
// case keys when sending to the server, PascalCase when feeding the form.
function toPascalCaseKeys(obj: Readonly<Record<string, unknown>>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key.charAt(0).toUpperCase() + key.slice(1), value])
  );
}

function toCamelCaseKeys(obj: Readonly<Record<string, unknown>>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key.charAt(0).toLowerCase() + key.slice(1), value])
  );
}

export interface WorkspaceEntityFormPageProps {
  readonly mode: 'create' | 'edit';
}

// Workspace-scoped entity form page. Mounts `<EntityForm />` driven by
// `useEntityForm` (the React Hook Form adapter) against the manifest's
// `default` form variant. In edit mode, the existing entity is fetched
// and seeded into RHF defaults (camelCase wire → PascalCase before
// passing to `useEntityForm`). On submit, the values are flipped back
// to camelCase and POST-ed (create) or PATCH-ed (edit) to
// `${basePath}` / `${basePath}/{id}` (basePath comes from the entity
// discovery's `links.list`). PATCH is the canonical update verb across
// Granit endpoints (`MapPatch("/{id:guid}", …)` in Parties / Documents
// / Folders); PUT is reserved for the typed sub-resources (tax-status /
// metadata / replace-by-name). Validation is server-authoritative — the
// .NET endpoints run FluentValidation, so the form here just relays
// the response toast.
function resolveSubmitLabel(
  isPending: boolean,
  isEditMode: boolean,
  t: ReturnType<typeof useTranslation>['t']
): string {
  if (isPending) return t('Common.Saving', 'Saving…');
  return isEditMode ? t('Common.Save', 'Save') : t('Common.Create', 'Create');
}

export function WorkspaceEntityFormPage({ mode }: WorkspaceEntityFormPageProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const client = useGranitClient();
  const queryClient = useQueryClient();
  const { workspace, entity, id } = useParams<{
    workspace: string;
    entity: string;
    id?: string;
  }>();

  const { data: manifest, isLoading: isManifestLoading } = useEntityMetadata(entity ?? '');
  const { data: discovery } = useEntityDiscovery();

  const basePath =
    entity && discovery
      ? (discovery.modules.flatMap((m) => m.items).find((it) => it.name === entity)?.links.list ??
        undefined)
      : undefined;
  const isEditMode = mode === 'edit';

  const {
    data: existingEntity,
    isLoading: isEntityLoading,
    isError: isEntityError,
  } = useQuery<Readonly<Record<string, unknown>>>({
    queryKey: ['entity', entity, id],
    queryFn: async () => {
      if (!basePath || !id) throw new Error('Missing base path or id');
      const response = await client.get<Readonly<Record<string, unknown>>>(
        `${basePath}/${encodeURIComponent(id)}`
      );
      return response.data;
    },
    enabled: isEditMode && Boolean(basePath && id),
  });

  const formVariant = manifest?.forms?.find((f) => f.name === 'default') ?? manifest?.forms?.[0];

  const initialValues = existingEntity ? toPascalCaseKeys(existingEntity) : undefined;
  const formApi = useEntityForm(
    formVariant ?? { name: '__pending', customizable: false, sections: [], hiddenByOverride: null },
    {
      defaultValues: initialValues,
    }
  );

  const handleSubmitSuccess = (data: Readonly<Record<string, unknown>>) => {
    queryClient.invalidateQueries({ queryKey: ['entity', entity] });
    toast.success(
      isEditMode
        ? t('Entity.Form.Updated', 'Saved changes')
        : t('Entity.Form.Created', 'Created successfully')
    );
    const newId = (data.id ?? id) as string | undefined;
    if (newId && workspace && entity) {
      navigate(
        `/w/${encodeURIComponent(workspace)}/${encodeURIComponent(entity)}/${encodeURIComponent(newId)}`
      );
    }
  };

  const submitMutation = useMutation({
    mutationFn: async (values: Readonly<Record<string, unknown>>) => {
      if (!basePath) throw new Error('Missing base path');
      const payload = toCamelCaseKeys(values);
      const response =
        isEditMode && id
          ? await client.patch(`${basePath}/${encodeURIComponent(id)}`, payload)
          : await client.post(basePath, payload);
      return response.data as Readonly<Record<string, unknown>>;
    },
    onSuccess: handleSubmitSuccess,
  });

  if (!workspace || !entity || (isEditMode && !id)) {
    return (
      <div data-slot="workspace-entity-form-page" className="space-y-2 p-6">
        <h2 className="text-2xl font-semibold">
          {t('Entity.MissingParam.Title', 'Missing entity parameter')}
        </h2>
      </div>
    );
  }

  if (isManifestLoading || (isEditMode && isEntityLoading)) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!manifest || (isEditMode && (isEntityError || !existingEntity))) {
    return (
      <div data-slot="workspace-entity-form-page" className="space-y-4 p-6">
        <h2 className="text-2xl font-semibold">
          {t('Entity.Form.NotFound.Title', 'Could not load record')}
        </h2>
        <Button
          variant="outline"
          onClick={() =>
            navigate(`/w/${encodeURIComponent(workspace)}/${encodeURIComponent(entity)}`)
          }
        >
          <ArrowLeft className="mr-2 size-4" />
          {t('Entity.Detail.BackToList', 'Back to list')}
        </Button>
      </div>
    );
  }

  if (!formVariant) {
    return (
      <div data-slot="workspace-entity-form-page" className="space-y-2 p-6">
        <h2 className="text-2xl font-semibold">
          {t('Entity.Form.NoVariant.Title', 'No form variant')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(
            'Entity.Form.NoVariant.Body',
            'The manifest does not declare a form variant for this entity.'
          )}
        </p>
      </div>
    );
  }

  const title = resolveLabel(
    manifest.identity?.displayKey ?? null,
    manifest.identity?.name ?? entity
  );
  const heading = isEditMode
    ? t('Entity.Form.Edit', 'Edit {{title}}', { title })
    : t('Entity.Form.Create', 'New {{title}}', { title });

  const onSubmit = formApi.handleSubmit((values) => {
    submitMutation.mutate(values);
  });

  return (
    <EntityPageLayout
      dataSlot="workspace-entity-form-page"
      contentWidth="comfortable"
      title={heading}
      subtitle={title}
      back={
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            navigate(`/w/${encodeURIComponent(workspace)}/${encodeURIComponent(entity)}`)
          }
        >
          <ArrowLeft className="mr-1 size-4" />
          {t('Entity.Detail.BackToList', 'Back to list')}
        </Button>
      }
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate(`/w/${encodeURIComponent(workspace)}/${encodeURIComponent(entity)}`)
            }
            disabled={submitMutation.isPending}
          >
            {t('Common.Cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            form="workspace-entity-form"
            disabled={submitMutation.isPending || !formApi.isDirty}
          >
            {resolveSubmitLabel(submitMutation.isPending, isEditMode, t)}
          </Button>
        </>
      }
    >
      <form
        id="workspace-entity-form"
        onSubmit={onSubmit}
        className="space-y-6"
        data-slot="workspace-entity-form"
        data-mode={mode}
      >
        <EntityForm
          variant={formVariant}
          values={formApi.formProps.values}
          onChange={formApi.formProps.onChange}
          errors={formApi.formProps.errors}
        />
      </form>

      {/* Child collections declared on the manifest. Read-only in the
          form for now — inline add / edit / delete on rows lands when
          granit-dotnet ships the editable `CollectionSection` primitive
          (Phase 1.G). Existing rows surface as Cards so the user can
          still see the entity's full state while editing the main
          fields. */}
      {isEditMode &&
        existingEntity &&
        [...(asExtended(manifest).collectionSections ?? [])]
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <CollectionSectionCard
              key={section.key}
              section={section}
              values={existingEntity}
              locale={i18n.language}
            />
          ))}
    </EntityPageLayout>
  );
}
