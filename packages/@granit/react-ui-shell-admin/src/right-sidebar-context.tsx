import { useLocalStorage } from '@granit/react-ui-kit';
import * as React from 'react';

interface RightSidebarContextValue {
  /** Desktop inline column open state (≥ lg). */
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
  /** Mobile Sheet open state (< lg). */
  readonly sheetOpen: boolean;
  readonly setSheetOpen: (open: boolean) => void;
  /** Convenience: toggles inline on lg+, opens Sheet on < lg. */
  readonly toggle: () => void;
}

const RightSidebarContext = React.createContext<RightSidebarContextValue | null>(null);

const STORAGE_KEY = 'granit:right-sidebar-open';
const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

export function RightSidebarProvider({ children }: { readonly children: React.ReactNode }) {
  const [open, setOpen] = useLocalStorage<boolean>(STORAGE_KEY, false);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const toggle = React.useCallback(() => {
    const isDesktop =
      globalThis.matchMedia === undefined
        ? true
        : globalThis.matchMedia(DESKTOP_MEDIA_QUERY).matches;
    if (isDesktop) setOpen(!open);
    else setSheetOpen(true);
  }, [open, setOpen]);

  const value = React.useMemo<RightSidebarContextValue>(
    () => ({ open, setOpen, sheetOpen, setSheetOpen, toggle }),
    [open, setOpen, sheetOpen, toggle]
  );

  return <RightSidebarContext.Provider value={value}>{children}</RightSidebarContext.Provider>;
}

// Co-locating the provider + hook keeps the context private to this module.
export function useRightSidebar() {
  const ctx = React.useContext(RightSidebarContext);
  if (!ctx) {
    throw new Error('useRightSidebar must be used inside <RightSidebarProvider>');
  }
  return ctx;
}
