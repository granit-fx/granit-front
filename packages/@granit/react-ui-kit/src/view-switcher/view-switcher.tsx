import { useTranslation } from '@granit/react-localization';
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@granit/react-ui';
import { LayoutGrid, List } from 'lucide-react';

export type ViewMode = 'list' | 'kanban';

export interface ViewSwitcherProps {
  readonly view: ViewMode;
  readonly onViewChange: (view: ViewMode) => void;
}

export function ViewSwitcher({ view, onViewChange }: Readonly<ViewSwitcherProps>) {
  const { t } = useTranslation();

  return (
    <div data-slot="view-switcher" className="flex rounded-md border">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            className="rounded-r-none border-0"
            onClick={() => onViewChange('list')}
            aria-pressed={view === 'list'}
          >
            <List className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('Common.ViewList')}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={view === 'kanban' ? 'default' : 'outline'}
            size="sm"
            className="rounded-l-none border-0"
            onClick={() => onViewChange('kanban')}
            aria-pressed={view === 'kanban'}
          >
            <LayoutGrid className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('Common.ViewKanban')}</TooltipContent>
      </Tooltip>
    </div>
  );
}
