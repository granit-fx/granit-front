import { useTranslation } from '@granit/react-localization';
import { useTemplateVariables } from '@granit/react-templating';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@granit/react-ui';
import { BracesIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { FilterPanel } from './filter-panel';
import { VariableList } from './variable-list';

import type { TemplateVariable } from '@granit/templating';

interface InsertVariableButtonProps {
  templateName: string;
  onInsert: (expression: string) => void;
}

export function InsertVariableButton({
  templateName,
  onInsert,
}: Readonly<InsertVariableButtonProps>) {
  const { t } = useTranslation();
  const { data: variables } = useTemplateVariables(templateName);
  const [open, setOpen] = useState(false);
  const [selectedVariable, setSelectedVariable] = useState<TemplateVariable | null>(null);

  const handleInsertRaw = useCallback(
    (variable: TemplateVariable) => {
      onInsert(`{{ ${variable.name} }}`);
      setSelectedVariable(null);
      setOpen(false);
    },
    [onInsert]
  );

  const handleInsertWithFilter = useCallback(
    (expression: string) => {
      onInsert(expression);
      setSelectedVariable(null);
      setOpen(false);
    },
    [onInsert]
  );

  const handleBack = useCallback(() => {
    setSelectedVariable(null);
  }, []);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) setSelectedVariable(null);
  }, []);

  const groups = useMemo(
    () =>
      [
        { label: 'Global', items: variables?.globalVariables ?? [] },
        { label: 'Model', items: variables?.modelVariables ?? [] },
        { label: 'Enrichment', items: variables?.enrichedVariables ?? [] },
      ].filter((g) => g.items.length > 0),
    [variables]
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={t('Templates.Editor.InsertVariable', 'Insert variable')}
            >
              <BracesIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {t('Templates.Editor.InsertVariable', 'Insert variable')}
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        className="w-72 p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {selectedVariable ? (
          <FilterPanel
            variable={selectedVariable}
            onInsertRaw={() => handleInsertRaw(selectedVariable)}
            onInsertWithFilter={handleInsertWithFilter}
            onBack={handleBack}
          />
        ) : (
          <VariableList
            groups={groups}
            onSelectVariable={setSelectedVariable}
            onInsertFunction={handleInsertWithFilter}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
