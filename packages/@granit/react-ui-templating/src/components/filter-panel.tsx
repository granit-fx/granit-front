import { useTranslation } from '@granit/react-localization';
import { Button } from '@granit/react-ui';
import { cn } from '@granit/utils';
import { ArrowLeft } from 'lucide-react';

import { getFiltersForType } from './scriban-filters';

import type { TemplateVariable } from '@granit/templating';

interface FilterPanelProps {
  readonly variable: TemplateVariable;
  readonly onInsertRaw: () => void;
  readonly onInsertWithFilter: (expression: string) => void;
  readonly onBack: () => void;
}

export function FilterPanel({
  variable,
  onInsertRaw,
  onInsertWithFilter,
  onBack,
}: Readonly<FilterPanelProps>) {
  const { t } = useTranslation();
  const filters = getFiltersForType(variable.type);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 border-b px-2 py-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onBack}
          aria-label={t('Common.Back', 'Back')}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>
        <code className="text-xs font-semibold">{variable.name}</code>
        <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {variable.type}
        </span>
      </div>

      <div className="px-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto w-full justify-start gap-2 px-2 py-1.5 font-mono text-xs"
          onClick={onInsertRaw}
        >
          <span className="font-semibold">{`{{ ${variable.name} }}`}</span>
          <span className="ml-auto font-sans text-muted-foreground">
            {t('Templates.Editor.NoFilter', 'No filter')}
          </span>
        </Button>
      </div>

      {filters.length > 0 && (
        <div className="max-h-48 overflow-y-auto border-t px-2 py-1">
          <p className="mb-1 px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {t('Templates.Editor.Filters', 'Filters')}
          </p>
          {filters.map((filter) => (
            <Button
              key={filter.label}
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'h-auto w-full justify-start gap-2 px-2 py-1.5 text-xs',
                'hover:bg-accent'
              )}
              onClick={() => onInsertWithFilter(filter.expression(variable.name))}
            >
              <code className="font-mono font-medium">{filter.label}</code>
              <span className="ml-auto text-muted-foreground">{filter.description}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
