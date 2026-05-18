import { assertSafeUrl } from '@granit/utils';

import type { WidgetActionHandler, WidgetActionHandlerRegistry } from './widget-action-handler.js';

/**
 * Builds a query string from the resolved params. Skips empty values
 * so a `params: { status: '' }` doesn't produce `?status=` in the URL.
 */
function appendParamsToUrl(url: string, params: Readonly<Record<string, string>>): string {
  const entries = Object.entries(params).filter(([, value]) => value !== '');
  if (entries.length === 0) return url;
  const search = new URLSearchParams(entries).toString();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${search}`;
}

/**
 * `Navigate` — frontend route navigation. v1 default uses
 * `globalThis.location.assign(target)` which preserves the browser's
 * history but triggers a full page load. Apps wanting React Router
 * (or any in-app SPA navigator) compose a custom handler that calls
 * `useNavigate()` instead.
 *
 * Resolved params are appended to the URL as a query string when set.
 */
const navigateHandler: WidgetActionHandler = (action, context) => {
  if (globalThis.window === undefined) return;
  const url = appendParamsToUrl(action.target, context.params);
  // Reject `javascript:` / protocol-relative URLs sourced from widget config
  // before navigation — defense in depth against compromised dashboard data.
  globalThis.location.assign(assertSafeUrl(url));
};

/**
 * `OpenDashboardView` — switches the active view of the current
 * dashboard. Reads the view setter from the dispatch context (which
 * the dispatcher hook fills from the surrounding
 * `<DashboardViewProvider>`). No-op when not inside a multi-view
 * dashboard.
 */
const openDashboardViewHandler: WidgetActionHandler = (action, context) => {
  context.setView?.(action.target);
};

/**
 * `OpenDashboard` — navigates to another full dashboard by name.
 * v1 default uses the conventional `/dashboards/{name}` route; apps
 * with a different routing scheme override.
 */
const openDashboardHandler: WidgetActionHandler = (action, context) => {
  if (globalThis.window === undefined) return;
  const url = appendParamsToUrl(`/dashboards/${encodeURIComponent(action.target)}`, context.params);
  globalThis.location.assign(assertSafeUrl(url));
};

/**
 * `ExportData` — emits a custom DOM event apps listen to wire their
 * own export pipeline (download dialog, server-streamed export job,
 * etc.). The event detail carries the `target` (an
 * `ExportDefinition.Name`) plus the resolved params.
 *
 * Apps registering a richer handler typically replace this entirely
 * (e.g. invoking a `useExportDialog()` hook) — emitting an event is
 * the framework's "no opinionated UI" default.
 */
const exportDataHandler: WidgetActionHandler = (action, context) => {
  if (globalThis.window === undefined) return;
  globalThis.dispatchEvent(
    new CustomEvent('granit:dashboard:export', {
      detail: { target: action.target, params: context.params, row: context.row ?? null },
    })
  );
};

/**
 * `OpenDetail` — emits a custom DOM event apps listen to open their
 * own side drawer / dialog. Same pattern as `ExportData` — the
 * framework doesn't ship a default drawer UI.
 */
const openDetailHandler: WidgetActionHandler = (action, context) => {
  if (globalThis.window === undefined) return;
  globalThis.dispatchEvent(
    new CustomEvent('granit:dashboard:open-detail', {
      detail: { target: action.target, params: context.params, row: context.row ?? null },
    })
  );
};

/**
 * Framework defaults for every {@link WidgetActionKind}. Apps
 * compose their own overrides via {@link composeWidgetActionHandlers}
 * — the typical case is replacing `Navigate` with React Router and
 * `ExportData` / `OpenDetail` with app-specific drawer / pipeline
 * hooks.
 */
export const defaultWidgetActionHandlers: WidgetActionHandlerRegistry = Object.freeze({
  Navigate: navigateHandler,
  OpenDashboardView: openDashboardViewHandler,
  OpenDashboard: openDashboardHandler,
  ExportData: exportDataHandler,
  OpenDetail: openDetailHandler,
});
