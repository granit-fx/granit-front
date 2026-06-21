import { useTranslation } from '@granit/react-localization';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Separator,
  SidebarTrigger,
} from '@granit/react-ui';
import { PanelRightClose, PanelRightOpen, Search } from 'lucide-react';
import { type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { openCommandPalette } from './command-palette-events';
import { useRightSidebar } from './right-sidebar-context';

export interface HeaderProps {
  /**
   * Maps the first route segment to a translation key for the breadcrumb root
   * (e.g. `{ users: 'Navigation.Users' }`). App-supplied so the chrome doesn't
   * hardcode an app's routes.
   */
  readonly routeLabels?: Record<string, string>;
  /** App widgets shown on the right (search, notification bell, …). */
  readonly actions?: ReactNode;
}

export function Header({ routeLabels = {}, actions }: HeaderProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { open: rightOpen, toggle: toggleRight } = useRightSidebar();

  const segments = location.pathname.split('/').filter(Boolean);
  const rootSegment = segments[0];
  const rootLabelKey = rootSegment ? routeLabels[rootSegment] : undefined;
  const detailSegment = segments[1]; // e.g. user id, country code, "new"

  return (
    <header
      data-slot="header"
      className="grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-border bg-background px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {rootLabelKey && !detailSegment && (
              <BreadcrumbItem>
                <BreadcrumbPage>{t(rootLabelKey)}</BreadcrumbPage>
              </BreadcrumbItem>
            )}
            {rootLabelKey && detailSegment && (
              <>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${rootSegment}`}>{t(rootLabelKey)}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {detailSegment === 'new' ? t('Common.Edit', 'New') : detailSegment}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="hidden justify-self-center md:block">
        <button
          type="button"
          onClick={openCommandPalette}
          data-slot="command-palette-trigger"
          className="flex h-9 w-80 items-center gap-2 rounded-md border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:w-[28rem]"
          aria-label={t('Command.Open', 'Open command palette')}
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">
            {t('Command.Placeholder', 'Type a command or search…')}
          </span>
          <kbd className="ml-auto rounded border border-border bg-background px-1.5 font-mono text-xs text-muted-foreground">
            {typeof navigator !== 'undefined' && /Mac|iP(hone|od|ad)/.test(navigator.userAgent)
              ? '⌘K'
              : 'Ctrl+K'}
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2 justify-self-end">
        {actions}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={t('Common.RightSidebar', 'Toggle right panel')}
          aria-expanded={rightOpen}
          onClick={toggleRight}
          className="h-8 w-8"
        >
          {rightOpen ? (
            <PanelRightClose className="h-4 w-4" aria-hidden />
          ) : (
            <PanelRightOpen className="h-4 w-4" aria-hidden />
          )}
        </Button>
      </div>
    </header>
  );
}
