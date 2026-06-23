import { FormLayoutEditor, type SchemaField } from '@granit/react-entities-customization';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@granit/react-ui';

import { WorkspaceCustomizationTab } from './workspace-customization-tab';

import type { LayoutDelta } from '@granit/entities-customization';

interface EntityCustomizationSectionProps {
  readonly entityName: string;
  readonly isManifestLoading: boolean;
  readonly isCustomizationLoading: boolean;
  readonly fields: readonly SchemaField[];
  readonly draftDeltas: readonly LayoutDelta[];
  readonly setDraftDeltas: (deltas: readonly LayoutDelta[]) => void;
  readonly groups: ReadonlyArray<{ readonly key: string; readonly label: string }>;
  readonly onSave: () => void;
  readonly onReset: () => void;
  readonly isSavePending: boolean;
  readonly onInspectField: (name: string | null) => void;
}

export function EntityCustomizationSection({
  entityName,
  isManifestLoading,
  isCustomizationLoading,
  fields,
  draftDeltas,
  setDraftDeltas,
  groups,
  onSave,
  onReset,
  isSavePending,
  onInspectField,
}: EntityCustomizationSectionProps) {
  const { t } = useTranslation();

  if (!entityName) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          {t('customization:Picker.Empty', 'Pick an entity to start editing.')}
        </CardContent>
      </Card>
    );
  }

  if (isManifestLoading || isCustomizationLoading) return <Spinner />;

  return (
    <Tabs defaultValue="forms">
      <TabsList>
        <TabsTrigger value="forms">
          {t('customization:Tabs.Forms', { defaultValue: 'Forms' })}
        </TabsTrigger>
        <TabsTrigger value="workspaces">
          {t('customization:Tabs.Workspaces', { defaultValue: 'Workspaces' })}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="forms" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('customization:Form.Title', { defaultValue: 'Form layout' })}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onReset}>
                {t('Common.Reset', 'Reset')}
              </Button>
              <Button size="sm" onClick={onSave} disabled={isSavePending}>
                {isSavePending ? t('Common.Saving', 'Saving…') : t('Common.Save', 'Save')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <FormLayoutEditor
              fields={fields}
              deltas={draftDeltas}
              onChange={setDraftDeltas}
              availableGroups={groups}
              className="space-y-1"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {fields.map((f) => (
                <Button
                  key={f.name}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => onInspectField(f.name)}
                >
                  {t('customization:Inspector.Open', {
                    defaultValue: `Inspect ${f.name}`,
                    fieldName: f.name,
                  })}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="workspaces" className="space-y-4">
        <WorkspaceCustomizationTab />
      </TabsContent>
    </Tabs>
  );
}
