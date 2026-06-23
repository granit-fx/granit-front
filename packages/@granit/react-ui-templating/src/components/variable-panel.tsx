import { useTranslation } from '@granit/react-localization';
import { useTemplateVariables } from '@granit/react-templating';
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@granit/react-ui';
import { cn } from '@granit/utils';

import type { TemplateVariable } from '@granit/templating';

interface VariablePanelProps {
  templateName: string;
  onInsert: (expression: string) => void;
  className?: string;
}

export function VariablePanel({ templateName, onInsert, className }: Readonly<VariablePanelProps>) {
  const { t } = useTranslation();
  const { data: variables, isLoading } = useTemplateVariables(templateName);

  const handleInsert = (variableName: string) => {
    onInsert(`{{ ${variableName} }}`);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">{t('Templates.Editor.Variables')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!variables) return null;

  return (
    <Card data-slot="variable-panel" className={cn('overflow-auto', className)}>
      <CardHeader>
        <CardTitle className="text-sm">{t('Templates.Editor.Variables')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {variables.globalVariables.length > 0 && (
          <VariableGroup
            label="Global"
            variables={variables.globalVariables}
            onInsert={handleInsert}
          />
        )}
        {variables.modelVariables.length > 0 && (
          <VariableGroup
            label="Model"
            variables={variables.modelVariables}
            onInsert={handleInsert}
          />
        )}
        {variables.enrichedVariables.length > 0 && (
          <VariableGroup
            label="Enrichment"
            variables={variables.enrichedVariables}
            onInsert={handleInsert}
          />
        )}
      </CardContent>
    </Card>
  );
}

function VariableGroup({
  label,
  variables,
  onInsert,
}: Readonly<{
  label: string;
  variables: readonly TemplateVariable[];
  onInsert: (name: string) => void;
}>) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1">
        {variables.map((v) => (
          <Button
            key={v.name}
            type="button"
            variant="outline"
            size="sm"
            className="h-auto px-2 py-1 font-mono text-xs"
            onClick={() => onInsert(v.name)}
            title={v.description ?? v.type}
          >
            {v.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
