import type { DashboardCategory } from './dashboard-category';
import type { DashboardStatus } from './dashboard-status';
import type { WidgetDefinitionBase } from './widget-definition';
import type { AxiosRequestConfig } from '@granit/api-client';

/**
 * Optional per-call request options forwarded to axios. Restricted to the
 * fields the dashboards hooks need (notably `signal` for React Query
 * cancellation). Avoids importing the full `AxiosRequestConfig` surface at
 * each call site.
 */
export type DashboardsRequestOptions = Pick<AxiosRequestConfig, 'signal'>;

/**
 * Query params accepted by `GET {basePath}/catalog`.
 */
export interface DashboardCatalogParams {
  /** Filter catalog entries to a specific category. `undefined` = all categories. */
  readonly category?: DashboardCategory;
}

/**
 * Query params accepted by `GET {basePath}/`.
 */
export interface DashboardListParams {
  /** Filter by lifecycle state. `undefined` = all statuses. */
  readonly status?: DashboardStatus;
  /** Zero-based page index. Backend default: 0. */
  readonly page?: number;
  /** Page size. Backend default: 50, capped at 200. */
  readonly pageSize?: number;
}

/**
 * Body for `POST {widgetsBasePath}/{kind}/render` — the per-widget render
 * endpoints (P3, symmetric with the bundle path).
 */
export interface WidgetRenderBody<TDefinition extends WidgetDefinitionBase> {
  readonly definition: TDefinition;
  readonly context: WidgetRenderContextPayload;
}

/**
 * Context passed alongside the widget definition to the per-widget render
 * endpoints. Same shape as the dashboard-level
 * `DashboardRenderRequest` minus the dashboard-scoped fields.
 */
export interface WidgetRenderContextPayload {
  readonly periodFrom?: string;
  readonly periodTo?: string;
  readonly periodToken?: string;
  readonly locale?: string;
  readonly filters?: Readonly<Record<string, string>> | null;
}

/**
 * Wire-format kinds accepted by the per-widget render endpoints.
 */
export type WidgetRenderKind = 'kpi' | 'chart' | 'table' | 'pivot' | 'map';
