import { SidebarProvider, TooltipProvider } from '@granit/react-ui';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import type {
  FeatureRouteTable,
  WorkspaceItemResponse,
  WorkspaceResponse,
  WorkspaceTreeResponse,
} from '@granit/workspaces';
import type { ReactElement, ReactNode } from 'react';

// The shared jsdom setup installs `matchMedia` on `window` but `react-ui`'s
// `useIsMobile` reads `globalThis.matchMedia`. Alias it so SidebarProvider's
// mobile check resolves in tests.
if (typeof globalThis.matchMedia !== 'function') {
  globalThis.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof globalThis.matchMedia;
}

// ---------------------------------------------------------------------------
// i18n stub
// ---------------------------------------------------------------------------
// The shell-admin package ships no locale bundle; every component calls
// `t(key, fallback)` with an inline English fallback. Tests mock the
// localization hook (`vi.mock('@granit/react-localization', …)`) so `t`
// returns the provided fallback (or the key when none is given) — this yields
// the same visible strings the app renders, without booting i18next.
export function makeT() {
  return (key: string, fallback?: string) => fallback ?? key;
}

// ---------------------------------------------------------------------------
// Render helper — wraps in MemoryRouter (components read useLocation /
// useNavigate), SidebarProvider (sidebar primitives require it) and
// TooltipProvider (SidebarMenuButton tooltips). `route` seeds the initial
// location so active/inactive nav branches can be exercised.
// ---------------------------------------------------------------------------
export function renderShell(ui: ReactElement, options: { readonly route?: string } = {}) {
  const { route = '/' } = options;
  return {
    ...render(ui, {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <MemoryRouter initialEntries={[route]}>
          <TooltipProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </TooltipProvider>
        </MemoryRouter>
      ),
    }),
    user: userEvent.setup(),
  };
}

// ---------------------------------------------------------------------------
// Workspace fixture builders
// ---------------------------------------------------------------------------
export function makeItem(overrides: Partial<WorkspaceItemResponse> = {}): WorkspaceItemResponse {
  return {
    kind: 'Entity',
    order: 0,
    displayKey: null,
    icon: null,
    entityName: null,
    entityViewName: null,
    entityPresetOverlay: null,
    dashboardName: null,
    linkUrl: null,
    subWorkspaceName: null,
    featureName: null,
    routeName: null,
    ...overrides,
  };
}

export function makeWorkspace(overrides: Partial<WorkspaceResponse> = {}): WorkspaceResponse {
  return {
    name: 'crm',
    displayKey: null,
    icon: null,
    order: 0,
    isShell: false,
    sections: [],
    ...overrides,
  };
}

export function makeTree(workspaces: readonly WorkspaceResponse[]): WorkspaceTreeResponse {
  return { schemaVersion: 1, workspaces };
}

export const emptyFeatureRoutes: FeatureRouteTable = {};
