import { useTranslation } from '@granit/react-localization';
import { Card, CardContent, CardHeader, CardTitle } from '@granit/react-ui';
import { Info } from 'lucide-react';

import { WorkspaceCapabilities } from './workspace-capabilities';

import type { AIWorkspaceResponse } from '@granit/ai';

interface WorkspaceDetailProps {
  readonly workspace: AIWorkspaceResponse;
}

export function WorkspaceDetail({ workspace }: WorkspaceDetailProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-lg border border-warning-500/25 bg-warning-500/15 p-4 text-sm text-warning-600 dark:text-warning-500">
        <Info className="h-4 w-4 shrink-0" />
        {t('AI.Workspaces.Kind.System:Hint', { nsSeparator: false })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('AI.Workspaces.Form.Provider')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('AI.Workspaces.Form.ProviderName')} value={workspace.provider} />
            <Field label={t('AI.Workspaces.Form.Model')} value={workspace.model} mono />
          </div>
          {workspace.workspaceModelName && (
            <Field label={t('AI.Workspaces.Form.ModelName')} value={workspace.workspaceModelName} />
          )}
          <WorkspaceCapabilities capabilities={workspace.capabilities} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('AI.Workspaces.Form.Configuration')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {workspace.systemPrompt && (
            <Field label={t('AI.Workspaces.Form.SystemPrompt')} value={workspace.systemPrompt} />
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('AI.Workspaces.Form.Temperature')}
              value={workspace.temperature?.toString() ?? '-'}
            />
            <Field
              label={t('AI.Workspaces.Form.MaxOutputTokens')}
              value={workspace.maxOutputTokens?.toString() ?? '-'}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  readonly label: string;
  readonly value: string;
  readonly mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={`text-sm ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
