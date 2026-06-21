import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@granit/react-ui';
import { cn } from '@granit/utils';

import { useRightSidebar } from './right-sidebar-context';

function Placeholder() {
  return (
    <div className="p-4 text-sm text-muted-foreground">
      Placeholder content. Timeline goes here later.
    </div>
  );
}

// Shell-level right column — mirrors `<AppSidebar />` on the right side
// of `<SidebarInset>`. Desktop (lg+): inline full-height column whose
// width animates between `--sidebar-width` and `0` based on the context
// open state. Mobile (< lg): hidden inline; opened as a right-anchored
// `<Sheet />` via `useRightSidebar().toggle()` (typically called from
// the Header trigger).
export function AppRightSidebar() {
  const { open, sheetOpen, setSheetOpen } = useRightSidebar();

  return (
    <>
      <aside
        data-slot="app-right-sidebar"
        data-state={open ? 'expanded' : 'collapsed'}
        className={cn(
          'hidden h-full shrink-0 overflow-hidden border-l border-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-linear lg:flex lg:flex-col',
          open ? 'w-(--sidebar-width)' : 'w-0 border-l-0'
        )}
      >
        <div className="flex-1 overflow-y-auto">
          <Placeholder />
        </div>
      </aside>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-hidden bg-sidebar p-0 text-sidebar-foreground sm:max-w-sm"
        >
          <SheetHeader className="h-16 shrink-0 justify-center border-b border-border px-4">
            <SheetTitle className="text-sm font-medium">Right sidebar</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <Placeholder />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
