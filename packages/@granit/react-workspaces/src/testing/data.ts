import { WORKSPACE_TREE_SCHEMA_VERSION } from '@granit/workspaces';

import type {
  LandingRouteResponse,
  WorkspaceItemResponse,
  WorkspaceResponse,
  WorkspaceTreeResponse,
} from '@granit/workspaces';

// ---------------------------------------------------------------------------
// Item factories
// ---------------------------------------------------------------------------
//
// The wire format models items as a single shape with mutually-exclusive
// optional fields narrowed on `kind` (see `WorkspaceItemResponse`). These
// helpers fill the irrelevant fields with `null` so the fixtures stay
// byte-compatible with the .NET serializer output.

function entityItem(args: {
  displayKey: string;
  entityName: string;
  icon?: string;
  preset?: Readonly<Record<string, unknown>>;
  order: number;
}): WorkspaceItemResponse {
  return {
    kind: 'Entity',
    order: args.order,
    displayKey: args.displayKey,
    icon: args.icon ?? null,
    entityName: args.entityName,
    entityViewName: null,
    entityPresetOverlay: args.preset ?? null,
    dashboardName: null,
    linkUrl: null,
    subWorkspaceName: null,
    featureName: null,
    routeName: null,
  };
}

function linkItem(args: {
  displayKey: string;
  url: string;
  icon?: string;
  order: number;
}): WorkspaceItemResponse {
  return {
    kind: 'Link',
    order: args.order,
    displayKey: args.displayKey,
    icon: args.icon ?? null,
    entityName: null,
    entityViewName: null,
    entityPresetOverlay: null,
    dashboardName: null,
    linkUrl: args.url,
    subWorkspaceName: null,
    featureName: null,
    routeName: null,
  };
}

function subWorkspaceItem(args: {
  displayKey: string;
  subWorkspaceName: string;
  icon?: string;
  order: number;
}): WorkspaceItemResponse {
  return {
    kind: 'SubWorkspace',
    order: args.order,
    displayKey: args.displayKey,
    icon: args.icon ?? null,
    entityName: null,
    entityViewName: null,
    entityPresetOverlay: null,
    dashboardName: null,
    linkUrl: null,
    subWorkspaceName: args.subWorkspaceName,
    featureName: null,
    routeName: null,
  };
}

// ---------------------------------------------------------------------------
// App workspaces
// ---------------------------------------------------------------------------
//
// Sample host workspaces (narrow scope until the .NET manifest grows
// child-collection / action primitives).

const appWorkspaces: readonly WorkspaceResponse[] = [
  {
    name: 'Showcase.CRM',
    displayKey: 'Showcase:Workspace.CRM',
    icon: 'contact',
    order: 0,
    isShell: false,
    sections: [
      {
        key: 'parties',
        displayKey: 'Showcase:Workspace.CRM.Section.Parties',
        order: 0,
        collapsedByDefault: false,
        items: [
          entityItem({
            displayKey: 'Showcase:Workspace.CRM.Parties',
            entityName: 'Granit.Parties.Party',
            icon: 'users',
            order: 0,
          }),
        ],
      },
      {
        key: 'productivity',
        displayKey: 'Showcase:Workspace.CRM.Section.Productivity',
        order: 1,
        collapsedByDefault: false,
        items: [
          entityItem({
            displayKey: 'Showcase:Workspace.CRM.Activities',
            entityName: 'Granit.Activities.Activity',
            icon: 'check-square',
            order: 0,
          }),
        ],
      },
    ],
  },
  {
    name: 'Showcase.SaaS',
    displayKey: 'Showcase:Workspace.SaaS',
    icon: 'calculator',
    order: 1,
    isShell: false,
    sections: [
      {
        key: 'parties',
        displayKey: 'Showcase:Workspace.SaaS.Section.Parties',
        order: 0,
        collapsedByDefault: false,
        items: [
          entityItem({
            displayKey: 'Showcase:Workspace.SaaS.Parties',
            entityName: 'Granit.Parties.Party',
            icon: 'users',
            // Mirrors AccountingWorkspaceDefinition.WithOpenBalanceOverlay —
            // narrows the Party list to non-zero outstanding balance.
            preset: {
              filter: { 'balance.gt': '0' },
              sort: '-balance',
            },
            order: 0,
          }),
        ],
      },
      {
        key: 'invoicing',
        displayKey: 'Showcase:Workspace.SaaS.Section.Invoicing',
        order: 1,
        collapsedByDefault: false,
        items: [
          entityItem({
            displayKey: 'Showcase:Workspace.SaaS.Invoices',
            entityName: 'Granit.Invoicing.Invoice',
            icon: 'file-text',
            order: 0,
          }),
          linkItem({
            displayKey: 'Showcase:Workspace.SaaS.Payments',
            url: '/payments',
            icon: 'credit-card',
            order: 1,
          }),
          linkItem({
            displayKey: 'Showcase:Workspace.SaaS.PaymentMethods',
            url: '/payments/methods',
            icon: 'credit-card',
            order: 2,
          }),
        ],
      },
      {
        key: 'reports',
        displayKey: 'Showcase:Workspace.SaaS.Section.Reports',
        order: 2,
        collapsedByDefault: false,
        items: [
          linkItem({
            displayKey: 'Showcase:Workspace.SaaS.CustomerBalance',
            url: '/customer-balance',
            icon: 'activity',
            order: 0,
          }),
          linkItem({
            displayKey: 'Showcase:Workspace.SaaS.Subscriptions',
            url: '/subscriptions',
            icon: 'credit-card',
            order: 1,
          }),
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Framework shells
// ---------------------------------------------------------------------------
//
// Shells are populated through `IWorkspaceContributor` on the .NET side. The
// mock pre-populates each with `Link` items pointing at the existing legacy
// routes so the Frappe-style launcher can drill into realistic destinations
// while the manifest renderer matures. Shells without items would auto-filter
// on the .NET side; we omit them here too.

const shellWorkspaces: readonly WorkspaceResponse[] = [
  {
    name: 'System',
    displayKey: 'WorkspacesFramework:Workspace.System',
    icon: 'server',
    order: 0,
    isShell: true,
    sections: [
      {
        key: 'system',
        displayKey: null,
        order: 0,
        collapsedByDefault: false,
        items: [
          linkItem({ displayKey: 'Settings', url: '/settings/config', icon: 'settings', order: 0 }),
          linkItem({ displayKey: 'Features', url: '/features', icon: 'flag', order: 1 }),
          linkItem({ displayKey: 'Tenants', url: '/tenants', icon: 'building', order: 2 }),
          linkItem({
            displayKey: 'Subscriptions',
            url: '/subscriptions',
            icon: 'credit-card',
            order: 3,
          }),
        ],
      },
    ],
  },
  {
    name: 'Users',
    displayKey: 'WorkspacesFramework:Workspace.Users',
    icon: 'users',
    order: 1,
    isShell: true,
    sections: [
      {
        key: 'identity',
        displayKey: null,
        order: 0,
        collapsedByDefault: false,
        items: [
          linkItem({ displayKey: 'Users', url: '/identity/users', icon: 'users', order: 0 }),
          linkItem({ displayKey: 'Roles', url: '/identity/roles', icon: 'shield', order: 1 }),
          linkItem({ displayKey: 'Groups', url: '/identity/groups', icon: 'users', order: 2 }),
          linkItem({
            displayKey: 'Permissions',
            url: '/authorization/permissions',
            icon: 'shield',
            order: 3,
          }),
        ],
      },
    ],
  },
  {
    name: 'Automation',
    displayKey: 'WorkspacesFramework:Workspace.Automation',
    icon: 'zap',
    order: 2,
    isShell: true,
    sections: [
      {
        key: 'automation',
        displayKey: null,
        order: 0,
        collapsedByDefault: false,
        items: [
          linkItem({
            displayKey: 'Background Jobs',
            url: '/background-jobs',
            icon: 'activity',
            order: 0,
          }),
          linkItem({ displayKey: 'Scheduling', url: '/scheduling', icon: 'zap', order: 1 }),
          linkItem({
            displayKey: 'AI Workspaces',
            url: '/ai/workspaces',
            icon: 'zap',
            order: 2,
          }),
        ],
      },
    ],
  },
  {
    name: 'Data',
    displayKey: 'WorkspacesFramework:Workspace.Data',
    icon: 'database',
    order: 3,
    isShell: true,
    sections: [
      {
        key: 'data',
        displayKey: null,
        order: 0,
        collapsedByDefault: false,
        items: [
          linkItem({ displayKey: 'Countries', url: '/countries', icon: 'database', order: 0 }),
          linkItem({ displayKey: 'Tax Rates', url: '/tax/rates', icon: 'database', order: 1 }),
          linkItem({ displayKey: 'Metering', url: '/metering', icon: 'database', order: 2 }),
        ],
      },
    ],
  },
  {
    name: 'Email',
    displayKey: 'WorkspacesFramework:Workspace.Email',
    icon: 'mail',
    order: 4,
    isShell: true,
    sections: [
      {
        key: 'email',
        displayKey: null,
        order: 0,
        collapsedByDefault: false,
        items: [
          linkItem({ displayKey: 'Notifications', url: '/notifications', icon: 'mail', order: 0 }),
        ],
      },
    ],
  },
  {
    name: 'Monitoring',
    displayKey: 'WorkspacesFramework:Workspace.Monitoring',
    icon: 'activity',
    order: 6,
    isShell: true,
    sections: [
      {
        key: 'monitoring',
        displayKey: null,
        order: 0,
        collapsedByDefault: false,
        items: [
          linkItem({ displayKey: 'Audit Log', url: '/auditing', icon: 'activity', order: 0 }),
          linkItem({ displayKey: 'Diagnostics', url: '/diagnostics', icon: 'activity', order: 1 }),
          linkItem({ displayKey: 'Dashboards', url: '/dashboards', icon: 'activity', order: 2 }),
        ],
      },
    ],
  },
];

// Root Framework workspace — references each shell as a SubWorkspace item.
// On the launcher its tile opens a modal listing the shells; clicking one
// navigates to the shell's own workspace page.
const frameworkRoot: WorkspaceResponse = {
  name: 'Granit.Framework',
  displayKey: 'WorkspacesFramework:Workspace.Framework',
  icon: 'settings',
  order: 1000,
  isShell: false,
  sections: [
    {
      key: 'framework',
      displayKey: 'WorkspacesFramework:Section.Framework',
      order: 0,
      collapsedByDefault: false,
      items: shellWorkspaces.map((shell, idx) =>
        subWorkspaceItem({
          displayKey: shell.displayKey ?? shell.name,
          subWorkspaceName: shell.name,
          icon: shell.icon ?? undefined,
          order: idx,
        })
      ),
    },
  ],
};

// ---------------------------------------------------------------------------
// Tree & landing route
// ---------------------------------------------------------------------------

export const mockWorkspaceTree: WorkspaceTreeResponse = {
  schemaVersion: WORKSPACE_TREE_SCHEMA_VERSION,
  workspaces: [...appWorkspaces, ...shellWorkspaces, frameworkRoot],
};

export const mockDefaultLandingRoute: LandingRouteResponse = {
  route: '/',
  source: 'Framework',
};
