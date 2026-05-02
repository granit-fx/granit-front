import { useGranitClient } from '@granit/react-api-client';
import { useCallback } from 'react';

import type { AxiosInstance } from '@granit/api-client';
import type { EntityActionManifest } from '@granit/entities';

/**
 * Per-kind override hooks for {@link useEntityActionDispatcher}. Apps
 * pass any subset to replace the framework defaults — the most common
 * override is `navigate` (to plug in React Router / `useNavigate()`)
 * and `workflowTransition` (to wire up `useExecuteTransition()` from
 * `@granit/react-workflow`, which the framework doesn't depend on).
 */
export interface EntityActionHandlers {
  /**
   * `ApiCall` — POST/PUT/DELETE to `action.urlTemplate` with `{id}`
   * substituted from the row. Default issues the call through the
   * ambient `useGranitClient()` axios instance. Apps replace this to
   * thread custom headers, optimistic UI updates, etc.
   */
  readonly apiCall?: EntityActionHandler;
  /**
   * `Download` — GET to `action.urlTemplate` returning a binary
   * payload. Default triggers a browser download via a synthesised
   * `<a download>` link.
   */
  readonly download?: EntityActionHandler;
  /**
   * `Navigate` — client-side route or external URL. Default uses
   * `globalThis.location.href = …` for a full page load. Apps with
   * SPA routers (React Router, TanStack Router) override to call
   * `navigate(url)` instead so the route stays in-app.
   */
  readonly navigate?: EntityActionHandler;
  /**
   * `WorkflowTransition` — resolved through the entity's workflow
   * runtime. The framework does not depend on `@granit/react-workflow`,
   * so the default emits a `console.warn` and short-circuits — apps
   * with workflow-bearing entities must wire this slot.
   */
  readonly workflowTransition?: EntityActionHandler;
}

/**
 * Per-kind handler signature. Receives the full action descriptor, the
 * row id (`null` for entity-scope header actions), and the row data
 * (`null` for the header).
 */
export type EntityActionHandler = (
  action: EntityActionManifest,
  rowId: string | null,
  row: Readonly<Record<string, unknown>> | null,
  client: AxiosInstance
) => void | Promise<void>;

/**
 * Single-call dispatcher returned by {@link useEntityActionDispatcher}.
 * Branches on `action.kind` and delegates to the resolved handler.
 */
export type EntityActionDispatch = (
  action: EntityActionManifest,
  rowId: string | null,
  row: Readonly<Record<string, unknown>> | null
) => Promise<void>;

/**
 * Builds the action dispatcher used by `<EntityGallery />` /
 * `<EntityCalendar />` / `<EntityListPageHeader />` icon-buttons. The
 * dispatcher reads `action.kind` and:
 *
 * - **ApiCall** — confirms via `globalThis.confirm(action.confirmationKey)`
 *   when set, then issues the declared HTTP method against the
 *   `{id}`-substituted URL through the ambient axios client.
 * - **Download** — issues a GET with `responseType: 'blob'`, then
 *   synthesises a `<a download>` to trigger the browser download
 *   dialog. Filename is derived from the `Content-Disposition`
 *   header when present, else the URL's last segment.
 * - **Navigate** — sets `globalThis.location.href` (full page load).
 *   Apps with SPA routers override the `navigate` handler to call
 *   their router's navigate function.
 * - **WorkflowTransition** — emits a `console.warn` and no-ops.
 *   The framework doesn't depend on `@granit/react-workflow`, so
 *   apps wire this through the `workflowTransition` handler.
 *
 * Pass `handlers` to override any subset.
 */
export function useEntityActionDispatcher(
  handlers: EntityActionHandlers = {}
): EntityActionDispatch {
  const client = useGranitClient();
  const apiCall = handlers.apiCall ?? defaultApiCall;
  const download = handlers.download ?? defaultDownload;
  const navigate = handlers.navigate ?? defaultNavigate;
  const workflowTransition = handlers.workflowTransition ?? defaultWorkflowTransition;

  return useCallback<EntityActionDispatch>(
    async (action, rowId, row) => {
      switch (action.kind) {
        case 'ApiCall':
          await apiCall(action, rowId, row, client);
          return;
        case 'Download':
          await download(action, rowId, row, client);
          return;
        case 'Navigate':
          await navigate(action, rowId, row, client);
          return;
        case 'WorkflowTransition':
          await workflowTransition(action, rowId, row, client);
          return;
      }
    },
    [client, apiCall, download, navigate, workflowTransition]
  );
}

/**
 * Substitutes `{id}` in the URL template with the row id (URL-encoded).
 * Throws when the template carries `{id}` but no row id is supplied —
 * the .NET builder enforces "no `{id}` on header actions" at host
 * startup so this shouldn't fire in normal operation; the throw exists
 * to surface bugs when a contributor pinned an action on the wrong
 * surface.
 */
export function resolveActionUrl(template: string, rowId: string | null): string {
  if (!template.includes('{id}')) return template;
  if (rowId === null) {
    throw new Error(
      `Action URL template "${template}" carries an {id} placeholder but no row id is available. Ensure the action is pinned on a row-scope surface (gallery card / calendar tile / kanban card), not the list-page header.`
    );
  }
  return template.replaceAll('{id}', encodeURIComponent(rowId));
}

const defaultApiCall: EntityActionHandler = async (action, rowId, _row, client) => {
  if (!action.urlTemplate || !action.httpMethod) return;
  if (action.confirmationKey && !globalThis.confirm(action.confirmationKey)) return;
  const url = resolveActionUrl(action.urlTemplate, rowId);
  await client.request({ url, method: action.httpMethod });
};

const defaultDownload: EntityActionHandler = async (action, rowId, _row, client) => {
  if (!action.urlTemplate) return;
  const url = resolveActionUrl(action.urlTemplate, rowId);
  const response = await client.request<Blob>({ url, method: 'GET', responseType: 'blob' });
  const blobUrl = URL.createObjectURL(response.data);
  const filename = readFilename(response.headers as Record<string, string>) ?? defaultFilename(url);
  const anchor = globalThis.document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  globalThis.document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
};

const defaultNavigate: EntityActionHandler = (action, rowId) => {
  if (!action.urlTemplate) return;
  const url = resolveActionUrl(action.urlTemplate, rowId);
  globalThis.location.href = url;
};

const defaultWorkflowTransition: EntityActionHandler = (action) => {
  globalThis.console.warn(
    `EntityAction "${action.name}" is a WorkflowTransition; the framework's default dispatcher does not execute transitions. Pass a \`workflowTransition\` handler to \`useEntityActionDispatcher\` (typically wired through \`useExecuteTransition()\` from \`@granit/react-workflow\`).`
  );
};

function readFilename(headers: Record<string, string>): string | null {
  const disposition = headers['content-disposition'] ?? headers['Content-Disposition'];
  if (!disposition) return null;
  const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(disposition);
  const captured = match?.[1];
  return captured ? decodeURIComponent(captured) : null;
}

function defaultFilename(url: string): string {
  const path = url.split('?')[0] ?? url;
  const last = path.split('/').pop();
  return last && last.length > 0 ? last : 'download';
}
