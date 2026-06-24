import { useTranslation } from '@granit/react-localization';
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from '@granit/react-ui';
import { cn } from '@granit/utils';
import { MessageSquare, PanelRightClose, PanelRightOpen } from 'lucide-react';
import * as React from 'react';

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';
const STORAGE_KEY_DEFAULT = 'granit:detail-aside-open';

function getMatchMedia(): ((query: string) => MediaQueryList) | undefined {
  if (globalThis.window === undefined || typeof globalThis.window.matchMedia !== 'function')
    return undefined;
  return globalThis.window.matchMedia.bind(globalThis.window);
}

function useMatchesMedia(query: string) {
  const [matches, setMatches] = React.useState<boolean>(() => {
    const mm = getMatchMedia();
    return mm === undefined ? true : mm(query).matches;
  });
  React.useEffect(() => {
    const mm = getMatchMedia();
    if (mm === undefined) return;
    const mql = mm(query);
    const update = (event: MediaQueryListEvent) => setMatches(event.matches);
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);
  return matches;
}

function usePersistentBoolean(key: string, defaultValue: boolean) {
  const [value, setValue] = React.useState<boolean>(() => {
    if (globalThis.localStorage === undefined) return defaultValue;
    const raw = globalThis.localStorage.getItem(key);
    return raw === null ? defaultValue : raw === 'true';
  });
  React.useEffect(() => {
    if (globalThis.localStorage === undefined) return;
    globalThis.localStorage.setItem(key, String(value));
  }, [key, value]);
  return [value, setValue] as const;
}

interface DetailAsideContextValue {
  readonly asideTitle: string;
  readonly openSheet: () => void;
}

const DetailAsideContext = React.createContext<DetailAsideContextValue | null>(null);

// Optional secondary trigger. The rail handles mobile out of the box,
// but pages can still drop this in their header / actions row to give
// the aside a named entry point. Hidden on `lg+` since the inline panel
// is then visible.
export function DetailAsideMobileTrigger({
  className,
  label,
}: {
  readonly className?: string;
  readonly label?: string;
}) {
  const ctx = React.useContext(DetailAsideContext);
  if (!ctx) {
    throw new Error('DetailAsideMobileTrigger must be rendered inside <DetailAsideLayout>');
  }
  const text = label ?? ctx.asideTitle;
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={ctx.openSheet}
      aria-label={text}
      className={cn('lg:hidden', className)}
    >
      <MessageSquare className="mr-2 h-4 w-4" aria-hidden />
      {text}
    </Button>
  );
}

export interface DetailAsideLayoutProps {
  readonly children: React.ReactNode;
  /** Aside panel content — typically `<EntityTimeline />` or similar. */
  readonly aside: React.ReactNode;
  /** Label shown in the Sheet header and the rail / aria-labels. */
  readonly asideTitle: string;
  /**
   * Optional full-width row rendered above the two-pane grid (back
   * button, entity title, status badge…).
   */
  readonly header?: React.ReactNode;
  /** localStorage key for the persisted desktop collapse state. */
  readonly storageKey?: string;
}

// Two-pane layout for detail/edit surfaces. Desktop (lg+): inline
// right-side panel (sticky, 360px when expanded, 3rem rail when
// collapsed — state persisted in localStorage). Below `lg`: aside is
// hidden inline and rendered inside a right-anchored `<Sheet />` opened
// by `<DetailAsideMobileTrigger />` — single mount per breakpoint via
// the matched media query so providers (TimelineProvider, SSE) don't
// double-up.
export function DetailAsideLayout({
  children,
  aside,
  asideTitle,
  header,
  storageKey = STORAGE_KEY_DEFAULT,
}: DetailAsideLayoutProps) {
  const { t } = useTranslation();
  const isDesktop = useMatchesMedia(DESKTOP_MEDIA_QUERY);
  const [open, setOpen] = usePersistentBoolean(storageKey, true);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const showInline = open && isDesktop;

  const contextValue = React.useMemo<DetailAsideContextValue>(
    () => ({ asideTitle, openSheet: () => setSheetOpen(true) }),
    [asideTitle]
  );

  return (
    <DetailAsideContext.Provider value={contextValue}>
      <div data-slot="detail-aside-layout" className="space-y-6">
        {header && <div data-slot="detail-aside-header">{header}</div>}
        <div
          data-slot="detail-aside-grid"
          className={cn(
            'grid grid-cols-1 gap-6',
            open ? 'lg:grid-cols-[minmax(0,1fr)_360px]' : 'lg:grid-cols-[minmax(0,1fr)_3rem]'
          )}
        >
          <div data-slot="detail-aside-main" className="min-w-0 space-y-6">
            {children}
          </div>

          <aside
            data-slot="detail-aside-panel"
            data-state={showInline ? 'open' : 'collapsed'}
            className="hidden lg:block"
          >
            <div className="sticky top-6">
              {showInline ? (
                <div className="relative">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    aria-label={t('Common.Collapse')}
                    aria-expanded
                    title={t('Common.Collapse')}
                    onClick={() => setOpen(false)}
                    className="absolute top-4 -left-3 z-10 h-7 w-7 rounded-full border border-border shadow-md"
                  >
                    <PanelRightClose className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                  <div className="max-h-[calc(100vh-4rem)] overflow-y-auto">{aside}</div>
                </div>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label={asideTitle}
                  aria-expanded={false}
                  title={asideTitle}
                  onClick={() => setOpen(true)}
                  className="h-10 w-10"
                >
                  <PanelRightOpen className="h-4 w-4" aria-hidden />
                </Button>
              )}
            </div>
          </aside>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent
              side="right"
              className="flex w-full flex-col overflow-y-auto p-0 sm:max-w-md"
            >
              <SheetHeader className="border-b">
                <SheetTitle>{asideTitle}</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-4">{isDesktop ? null : aside}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </DetailAsideContext.Provider>
  );
}
