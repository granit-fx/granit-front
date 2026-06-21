import { SidebarInset, SidebarProvider } from '@granit/react-ui';
import { type ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { AppRightSidebar } from './app-right-sidebar';
import { AppSidebar } from './app-sidebar';
import { Header } from './header';
import { RightSidebarProvider } from './right-sidebar-context';

const SIDEBAR_COLLAPSE_BREAKPOINT = 1024;

export interface AppShellProps {
  /** Account/user menu rendered in the sidebar footer (app-supplied). */
  readonly userMenu?: ReactNode;
  /** Header right-side widgets (search, notification bell, …). */
  readonly headerActions?: ReactNode;
  /** First-route-segment → translation key map for the header breadcrumb. */
  readonly routeLabels?: Record<string, string>;
  /** Paths where the sidebar auto-collapses to icon mode (default `['/']`). */
  readonly collapsedPaths?: readonly string[];
  /** The routed page content. */
  readonly children: ReactNode;
}

/**
 * The admin app-shell frame: collapsible sidebar + topbar + scrollable content
 * + right rail. App-specific composition is injected — the account menu via
 * `userMenu`, header widgets via `headerActions`, the page via `children` — and
 * the navigation model via `ShellChromeProvider` (which must wrap this).
 */
export function AppShell({
  userMenu,
  headerActions,
  routeLabels,
  collapsedPaths = ['/'],
  children,
}: AppShellProps) {
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(
    () => globalThis.innerWidth > SIDEBAR_COLLAPSE_BREAKPOINT
  );

  useEffect(() => {
    const mql = globalThis.matchMedia(`(min-width: ${SIDEBAR_COLLAPSE_BREAKPOINT + 1}px)`);
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Auto-collapse to icon mode on launcher-style paths (e.g. `/`) so a tile
  // grid gets breathing room; the sidebar stays mounted and re-expandable.
  useEffect(() => {
    if (collapsedPaths.includes(location.pathname)) {
      // Sync the sidebar to the route change.
      setSidebarOpen(false);
    } else if (globalThis.innerWidth > SIDEBAR_COLLAPSE_BREAKPOINT) {
      setSidebarOpen(true);
    }
  }, [location.pathname, collapsedPaths]);

  return (
    <RightSidebarProvider>
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <AppSidebar userMenu={userMenu} />
        <SidebarInset>
          <Header routeLabels={routeLabels} actions={headerActions} />
          <div className="flex min-h-0 flex-1">
            <main className="min-w-0 flex-1 overflow-y-auto" data-slot="layout-main">
              {/* Default container: max-w-7xl + standard padding. EntityPageLayout
                  opts out via [data-content-width="full"] or constrains via
                  [data-content-width="narrow"]; the :has() selectors adapt the
                  wrapper so the shell stays unaware of the surrounding chrome. */}
              <div
                className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 has-[[data-content-width=full]]:max-w-full has-[[data-content-width=full]]:p-0 has-[[data-content-width=narrow]]:max-w-4xl"
                data-slot="layout-content"
              >
                {children}
              </div>
            </main>
            <AppRightSidebar />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RightSidebarProvider>
  );
}
