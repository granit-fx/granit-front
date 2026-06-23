import { usePermissions } from '@granit/react-authorization';
import { useEntityDiscovery, useEntityMetadata } from '@granit/react-entities';
import {
  RESOLUTION_LAYERS,
  FieldInspectorOverlay,
  useEntityCustomization,
  usePutEntityCustomization,
  type FieldResolutionEntry,
  type SchemaField,
} from '@granit/react-entities-customization';
import { useTranslation } from '@granit/react-localization';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  toast,
} from '@granit/react-ui';
import { useMemo, useState } from 'react';

import { EntityCustomizationSection } from './components/entity-customization-section';
import { EntityViewsTab } from './components/entity-views-tab';
import { useMemoSyncDraft } from './hooks/use-memo-sync-draft';

import type { LayoutDelta, LayoutKind } from '@granit/entities-customization';

const LAYOUT_KINDS: readonly LayoutKind[] = [
  'FormDefault',
  'DetailDefault',
  'List',
  'Calendar',
  'Gallery',
];

export function CustomizationPage() {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const canManageLayouts = hasPermission('EntitiesCustomization.Forms.Manage');
  const canManageViews = hasPermission('Entities.Views.Manage');

  if (!canManageLayouts && !canManageViews) {
    return (
      <div data-slot="customization-page" className="space-y-2 p-6">
        <h2 className="text-2xl font-semibold">
          {t('customization:Page.AccessDenied.Title', 'Access denied')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(
            'customization:Page.AccessDenied.Body',
            'You need EntitiesCustomization.Forms.Manage or Entities.Views.Manage to use this page.'
          )}
        </p>
      </div>
    );
  }

  return (
    <div data-slot="customization-page" className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('customization:Page.Title', 'Layout customization')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            'customization:Page.Subtitle',
            'Reorder, regroup, and hide fields per entity (Layer 1 admin overrides).'
          )}
        </p>
      </header>
      <Tabs defaultValue={canManageLayouts ? 'layouts' : 'views'}>
        <TabsList>
          {canManageLayouts && (
            <TabsTrigger value="layouts">
              {t('customization:TopTab.Layouts', { defaultValue: 'Layouts' })}
            </TabsTrigger>
          )}
          {canManageViews && (
            <TabsTrigger value="views">
              {t('customization:TopTab.Views', { defaultValue: 'Views' })}
            </TabsTrigger>
          )}
        </TabsList>
        {canManageLayouts && (
          <TabsContent value="layouts" className="mt-4">
            <CustomizationPageContent />
          </TabsContent>
        )}
        {canManageViews && (
          <TabsContent value="views" className="mt-4">
            <EntityViewsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function CustomizationPageContent() {
  const { t } = useTranslation();
  const { data: discovery } = useEntityDiscovery();
  const entities = useMemo(() => (discovery?.modules ?? []).flatMap((m) => m.items), [discovery]);
  const [entityName, setEntityName] = useState<string>('');
  const [layoutKind, setLayoutKind] = useState<LayoutKind>('FormDefault');
  const [draftDeltas, setDraftDeltas] = useState<readonly LayoutDelta[]>([]);
  const [inspectField, setInspectField] = useState<string | null>(null);

  const { data: manifest, isLoading: isManifestLoading } = useEntityMetadata(entityName);
  const { data: customization, isLoading: isCustomizationLoading } = useEntityCustomization({
    entityName,
    layoutKind,
  });
  const putMutation = usePutEntityCustomization();

  const serverDeltas = customization?.deltas ?? [];
  const serverDeltasKey = JSON.stringify(serverDeltas);
  useMemoSyncDraft(serverDeltasKey, () => setDraftDeltas(serverDeltas));

  const formManifest = useMemo(
    () => manifest?.forms?.find((f) => f.name === 'default') ?? manifest?.forms?.[0],
    [manifest]
  );

  const fields = useMemo<readonly SchemaField[]>(() => {
    if (!formManifest) return [];
    return formManifest.sections.flatMap((section) =>
      section.fields.map<SchemaField>((field) => ({
        name: field.propertyName,
        label: field.labelKey ?? field.propertyName,
        defaultGroup: section.key,
      }))
    );
  }, [formManifest]);

  const groups = useMemo(
    () => formManifest?.sections.map((s) => ({ key: s.key, label: s.labelKey ?? s.key })) ?? [],
    [formManifest]
  );

  // Layer 1 (admin) is the only layer with live data wired in this
  // showcase — Layer 2-5 are mocked with `value: null` so the inspector
  // renders the canonical 5-layer table and Layer 1's `winning` badge
  // surfaces.
  const inspectorEntries: readonly FieldResolutionEntry[] = useMemo(() => {
    if (!inspectField) return [];
    const layer1Hidden = draftDeltas.some(
      (d) => d.$type === 'hide' && d.fieldName === inspectField
    );
    return RESOLUTION_LAYERS.map<FieldResolutionEntry>((layer) =>
      layer === 'Layer1Admin'
        ? {
            layer,
            winning: true,
            summary: layer1Hidden
              ? t('customization:Inspector.Layer1.Hidden', { defaultValue: 'Hidden' })
              : t('customization:Inspector.Layer1.NoOverride', {
                  defaultValue: 'No admin override',
                }),
          }
        : { layer, winning: false, summary: '—' }
    );
  }, [draftDeltas, inspectField, t]);

  function handleSave() {
    if (!entityName) return;
    putMutation.mutate(
      { entityName, layoutKind, request: { deltas: draftDeltas } },
      {
        onSuccess: () =>
          toast.success(t('customization:Form.SaveSuccess', { defaultValue: 'Form layout saved' })),
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t('customization:Picker.Entity', 'Entity')}
          </label>
          <Select value={entityName} onValueChange={setEntityName}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder={t('customization:Picker.SelectEntity', 'Select entity')} />
            </SelectTrigger>
            <SelectContent>
              {entities.map((e: { readonly name: string }) => (
                <SelectItem key={e.name} value={e.name}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t('customization:Picker.LayoutKind', 'Layout')}
          </label>
          <Select value={layoutKind} onValueChange={(v) => setLayoutKind(v as LayoutKind)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LAYOUT_KINDS.map((k) => (
                <SelectItem key={k} value={k}>
                  {t(`customization:LayoutKind.${k}`, { defaultValue: k })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <EntityCustomizationSection
        entityName={entityName}
        isManifestLoading={isManifestLoading}
        isCustomizationLoading={isCustomizationLoading}
        fields={fields}
        draftDeltas={draftDeltas}
        setDraftDeltas={setDraftDeltas}
        groups={groups}
        onSave={handleSave}
        onReset={() => setDraftDeltas(serverDeltas)}
        isSavePending={putMutation.isPending}
        onInspectField={setInspectField}
      />

      <Sheet
        open={inspectField !== null}
        onOpenChange={(open: boolean) => !open && setInspectField(null)}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {t('customization:Inspector.Title', {
                defaultValue: `Field resolution: ${inspectField ?? ''}`,
                fieldName: inspectField ?? '',
              })}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {t(
                'customization:Inspector.Description',
                'Resolution chain for the selected field, layered manifest → tenant → user.'
              )}
            </SheetDescription>
          </SheetHeader>
          {inspectField && (
            <div className="px-4 pb-6">
              <FieldInspectorOverlay
                fieldName={inspectField}
                entries={inspectorEntries}
                className="space-y-2"
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
