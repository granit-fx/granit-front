import {
  WorkspaceLayoutEditor,
  usePutWorkspaceCustomization,
  useWorkspaceCustomization,
  type SchemaField,
} from '@granit/react-entities-customization';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  toast,
} from '@granit/react-ui';
import { useWorkspaces } from '@granit/react-workspaces';
import { useMemo, useState } from 'react';

import { useMemoSyncDraft } from '../hooks/use-memo-sync-draft';

import type { LayoutDelta } from '@granit/entities-customization';

function WorkspaceLayoutBody({
  isTreeLoading,
  workspaceName,
  isCustomizationLoading,
  fields,
  draftDeltas,
  setDraftDeltas,
  groups,
}: {
  readonly isTreeLoading: boolean;
  readonly workspaceName: string;
  readonly isCustomizationLoading: boolean;
  readonly fields: readonly SchemaField[];
  readonly draftDeltas: readonly LayoutDelta[];
  readonly setDraftDeltas: (deltas: readonly LayoutDelta[]) => void;
  readonly groups: ReadonlyArray<{ readonly key: string; readonly label: string }>;
}) {
  const { t } = useTranslation();

  if (isTreeLoading) return <Spinner />;
  if (!workspaceName) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {t('customization:Workspace.PickToStart', {
          defaultValue: 'Pick a workspace to start editing.',
        })}
      </p>
    );
  }
  if (isCustomizationLoading) return <Spinner />;
  if (fields.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {t('customization:Workspace.NoItems', {
          defaultValue: 'This workspace has no editable items.',
        })}
      </p>
    );
  }
  return (
    <WorkspaceLayoutEditor
      fields={fields}
      deltas={draftDeltas}
      onChange={setDraftDeltas}
      availableGroups={groups}
      className="space-y-1"
    />
  );
}

export function WorkspaceCustomizationTab() {
  const { t } = useTranslation();
  const { data: tree, isLoading: isTreeLoading } = useWorkspaces();
  const workspaces = tree?.workspaces ?? [];
  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [draftDeltas, setDraftDeltas] = useState<readonly LayoutDelta[]>([]);
  const { data: customization, isLoading: isCustomizationLoading } = useWorkspaceCustomization({
    workspaceName,
  });
  const putMutation = usePutWorkspaceCustomization();
  const serverDeltas = customization?.deltas ?? [];
  const serverDeltasKey = JSON.stringify(serverDeltas);
  useMemoSyncDraft(serverDeltasKey, () => setDraftDeltas(serverDeltas));

  const workspace = workspaces.find((w) => w.name === workspaceName);

  // Flatten section items into editor fields. Each item's stable
  // identifier is its kind-specific reference (entityName, dashboardName,
  // …); fall back to a synthetic `${kind}-${order}` when nothing is
  // populated (defensive — wire shape allows null on every field).
  const fields = useMemo<readonly SchemaField[]>(() => {
    if (!workspace) return [];
    return workspace.sections.flatMap((section) =>
      section.items.map<SchemaField>((item, idx) => ({
        name:
          item.entityName ??
          item.dashboardName ??
          item.linkUrl ??
          item.subWorkspaceName ??
          `${item.kind}-${section.key}-${idx}`,
        label: item.displayKey ?? undefined,
        defaultGroup: section.key,
      }))
    );
  }, [workspace]);

  const groups = useMemo(
    () => workspace?.sections.map((s) => ({ key: s.key, label: s.displayKey ?? s.key })) ?? [],
    [workspace]
  );

  function handleSave() {
    if (!workspaceName) return;
    putMutation.mutate(
      { workspaceName, request: { deltas: draftDeltas } },
      {
        onSuccess: () =>
          toast.success(
            t('customization:Workspace.SaveSuccess', { defaultValue: 'Workspace layout saved' })
          ),
      }
    );
  }

  const handleReset = () => setDraftDeltas(serverDeltas);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {t('customization:Workspace.Title', { defaultValue: 'Workspace layout' })}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={workspaceName} onValueChange={setWorkspaceName}>
            <SelectTrigger className="w-[240px]">
              <SelectValue
                placeholder={t('customization:Workspace.PickerPlaceholder', {
                  defaultValue: 'Select workspace',
                })}
              />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((w) => (
                <SelectItem key={w.name} value={w.name}>
                  {w.displayKey ? t(w.displayKey, { defaultValue: w.name }) : w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleReset} disabled={!workspaceName}>
            {t('Common.Reset', 'Reset')}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!workspaceName || putMutation.isPending}>
            {putMutation.isPending ? t('Common.Saving', 'Saving…') : t('Common.Save', 'Save')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <WorkspaceLayoutBody
          isTreeLoading={isTreeLoading}
          workspaceName={workspaceName}
          isCustomizationLoading={isCustomizationLoading}
          fields={fields}
          draftDeltas={draftDeltas}
          setDraftDeltas={setDraftDeltas}
          groups={groups}
        />
      </CardContent>
    </Card>
  );
}
