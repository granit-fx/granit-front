/**
 * Effective transport selected for a widget at render time. Mirrors
 * `Granit.Dashboards.WidgetTransport` (ADR-043 §2.3) — the composition
 * of the dashboard's push policy with the widget's `RefreshHint`.
 *
 * Surfaced on {@link DashboardRenderedWidget.transport} so the
 * frontend opens push subscriptions only for widgets that actually
 * receive live updates. Pull-only widgets continue to drive their
 * TanStack cache cadence from `RefreshHint`.
 *
 * - `'Pull'`: render via the pull endpoint and poll per `RefreshHint`
 *   TTL. Never open a stream for this widget.
 * - `'Push'`: open the live channel via `GET /dashboards/{id}/stream`
 *   and stop pulling once the seed envelope is rendered. The pull
 *   endpoint still returns the seed so the dashboard renders before
 *   the stream connects.
 *
 * PascalCase wire values match the backend's `JsonStringEnumConverter`
 * output. Hosts that haven't loaded `Granit.Dashboards.Push` always
 * emit `'Pull'` regardless of declared policy — the framework
 * degrades silently.
 */
export type WidgetTransport = 'Pull' | 'Push';
