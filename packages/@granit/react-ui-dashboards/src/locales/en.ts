// @granit/react-ui-dashboards — i18next resource bundle (flat keys, "translation" ns).
// Register in the host app:
//   import { dashboardsTranslationsEn } from "@granit/react-ui-dashboards";
//   i18n.addResourceBundle("en", "translation", dashboardsTranslationsEn, true, true);

export const dashboardsTranslationsEn = {
  'Dashboards.Demo.ManageDashboards': 'Manage dashboards',
  'Dashboards.Edit.AddWidget': 'Add widget',
  'Dashboards.Edit.AddWidget.Body':
    'Pick a widget type to drop on the dashboard. You can configure it after it lands on the grid.',
  'Dashboards.Edit.AddWidget.Title': 'Add a widget',
  'Dashboards.Edit.Confirm.Discard.Body':
    'Local edits will be reverted to the last saved version. This cannot be undone.',
  'Dashboards.Edit.Confirm.Discard.Title': 'Discard unsaved changes?',
  'Dashboards.Edit.Confirm.RemoveWidget.Body':
    '“{{slug}}” will be removed from the working copy. The deletion persists when you save.',
  'Dashboards.Edit.Confirm.RemoveWidget.Title': 'Remove widget?',
  'Dashboards.Edit.EditWidget.Title': 'Edit widget — {{slug}}',
  'Dashboards.Edit.SaveError': 'Could not save dashboard. Some changes may have been persisted.',
  'Dashboards.Edit.SaveSuccess': 'Dashboard saved',
  'Dashboards.Edit.SelectAWidget': 'Select a widget to edit its configuration.',
  'Dashboards.List.CatalogCategoryFilter.All': 'All categories',
  'Dashboards.List.Confirm.Archive.Body':
    '“{{name}}” will be hidden from tenants. Existing references stay intact and you can restore it from the Archived filter.',
  'Dashboards.List.Confirm.Archive.Title': 'Archive dashboard?',
  'Dashboards.List.Confirm.Publish.Body':
    '“{{name}}” will become visible to tenants assigned to this dashboard. You can archive it again later.',
  'Dashboards.List.Confirm.Publish.Title': 'Publish dashboard?',
  'Dashboards.List.Confirm.Restore.Body':
    '“{{name}}” will return to Draft status. Publish it again to expose it to tenants.',
  'Dashboards.List.Confirm.Restore.Title': 'Restore dashboard?',
  'Dashboards.List.Confirm.Resync.Body':
    '“{{name}}” will be re-synced from its source definition. Layout and widgets are replayed; the dashboard name and status are preserved, and per-widget overrides are carried over by slug.',
  'Dashboards.List.Confirm.Resync.Title': 'Re-sync dashboard?',
  'Dashboards.List.Drift.Ahead': 'Ahead of catalog',
  'Dashboards.List.Drift.AheadWithVersion': 'Ahead of catalog · catalog v{{version}}',
  'Dashboards.List.Drift.Behind': 'Out of date',
  'Dashboards.List.Drift.BehindWithVersion': 'Out of date · v{{version}} available',
  'Dashboards.List.Drift.Unknown': 'Source unknown',
  'Dashboards.List.Empty': 'No dashboards yet.',
  'Dashboards.List.ImportFromCatalogPlaceholder': '— Import from catalog —',
  'Dashboards.List.StatusFilter.All': 'All',
  'Dashboards.List.Subtitle': 'Manage the dashboards exposed to your tenants.',
  'Dashboards.List.Title': 'Dashboards',
  'Dashboards.List.Toast.ArchiveError': 'Could not archive “{{name}}”',
  'Dashboards.List.Toast.ArchiveSuccess': 'Archived “{{name}}”',
  'Dashboards.List.Toast.PublishError': 'Could not publish “{{name}}”',
  'Dashboards.List.Toast.PublishSuccess': 'Published “{{name}}”',
  'Dashboards.List.Toast.RestoreError': 'Could not restore “{{name}}”',
  'Dashboards.List.Toast.RestoreSuccess': 'Restored “{{name}}”',
  'Dashboards.List.Toast.ResyncError': 'Could not re-sync “{{name}}”',
  'Dashboards.List.Toast.ResyncSuccess':
    'Re-synced “{{name}}” to v{{version}} · {{widgetsAdded}} added, {{widgetsRemoved}} removed, {{overridesCarriedOver}} overrides preserved',
  'Dashboards.List.WidgetsSuffix': 'widgets',
} as const;

export type DashboardsTranslations = typeof dashboardsTranslationsEn;
