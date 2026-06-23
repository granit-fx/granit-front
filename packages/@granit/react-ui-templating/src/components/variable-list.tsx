import { useTranslation } from '@granit/react-localization';
import { Button } from '@granit/react-ui';

import { SCRIBAN_FUNCTIONS } from './scriban-filters';

import type { TemplateVariable } from '@granit/templating';

interface VariableListProps {
  readonly groups: readonly { label: string; items: readonly TemplateVariable[] }[];
  readonly onSelectVariable: (variable: TemplateVariable) => void;
  readonly onInsertFunction: (expression: string) => void;
}

export function VariableList({
  groups,
  onSelectVariable,
  onInsertFunction,
}: Readonly<VariableListProps>) {
  const { t } = useTranslation();

  return (
    <div className="max-h-72 space-y-2 overflow-y-auto p-2">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-1 text-xs font-medium text-muted-foreground">{group.label}</p>
          <div className="flex flex-wrap gap-1">
            {group.items.map((v) => (
              <Button
                key={v.name}
                type="button"
                variant="outline"
                size="sm"
                className="h-auto px-2 py-1 font-mono text-xs"
                onClick={() => onSelectVariable(v)}
                title={v.description ?? v.type}
              >
                {v.name}
              </Button>
            ))}
          </div>
        </div>
      ))}

      <div className="border-t pt-2">
        <p className="mb-1 px-1 text-xs font-medium text-muted-foreground">
          {t('Templates.Editor.Functions', 'Functions')}
        </p>
        <div className="space-y-0.5">
          {SCRIBAN_FUNCTIONS.map((fn) => (
            <Button
              key={fn.name}
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto w-full justify-start gap-2 px-2 py-1 text-xs"
              onClick={() => onInsertFunction(fn.expression)}
              title={fn.description}
            >
              <code className="font-mono font-medium">{fn.name}</code>
              <span className="ml-auto text-muted-foreground">{fn.description}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
