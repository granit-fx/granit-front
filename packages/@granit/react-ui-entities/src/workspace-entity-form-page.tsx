import { toPascalCaseKeys } from '@granit/entities';
import {
  EntityForm,
  useCreateEntity,
  useEntity,
  useEntityDiscovery,
  useEntityForm,
  useEntityMetadata,
  useUpdateEntity,
} from '@granit/react-entities';
import { resolveLabel, useTranslation } from '@granit/react-localization';
import { Button, Skeleton, toast } from '@granit/react-ui';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { CollectionSectionCard } from './collection-section-card';
import { EntityPageLayout } from './entity-page-layout';
import { asExtended } from './manifest-extensions';

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
  } = useEntity(entity ?? '', id, { basePath, enabled: isEditMode });

  const formVariant = manifest?.forms?.find((f) => f.name === 'default') ?? manifest?.forms?.[0];

  const initialValues = existingEntity ? toPascalCaseKeys(existingEntity) : undefined;
  const formApi = useEntityForm(
    formVariant ?? { name: '__pending', customizable: false, sections: [], hiddenByOverride: null },
    {
      defaultValues: initialValues,
    }
  );

  const handleSubmitSuccess = (data: Readonly<Record<string, unknown>>) => {
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

  // Manifest form values are PascalCase-keyed; the hooks flip them back to
  // the camelCase wire shape and invalidate the entity's row cache on
  // success (no manual `invalidateQueries` here).
  const createMutation = useCreateEntity(entity ?? '', { basePath, fromPascalCase: true });
  const updateMutation = useUpdateEntity(entity ?? '', { basePath, fromPascalCase: true });
  const submitPending = createMutation.isPending || updateMutation.isPending;

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
    if (isEditMode && id) {
      updateMutation.mutate({ id, values }, { onSuccess: handleSubmitSuccess });
    } else {
      createMutation.mutate(values, { onSuccess: handleSubmitSuccess });
    }
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
            disabled={submitPending}
          >
            {t('Common.Cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            form="workspace-entity-form"
            disabled={submitPending || !formApi.isDirty}
          >
            {resolveSubmitLabel(submitPending, isEditMode, t)}
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
