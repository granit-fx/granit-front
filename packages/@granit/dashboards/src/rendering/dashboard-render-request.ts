/**
 * Request body for `POST /dashboards/{id}/render`. Mirrors
 * `Granit.Dashboards.Endpoints.Dtos.DashboardRenderRequest` (B4-render,
 * ADR-039).
 *
 * The period window is supplied as absolute `[periodFrom, periodTo)` UTC
 * bounds; named-token resolution (`'mtd'`, `'qtd'`, …) is the caller's
 * responsibility — same convention as the analytics inline-metric endpoint.
 * Both bounds are required together; supplying only one is a 400 (the
 * backend `DashboardRenderRequestValidator` enforces the pairing).
 */
export interface DashboardRenderRequest {
  /** Inclusive lower bound (ISO 8601 UTC). Required when {@link periodTo} is set. */
  readonly periodFrom?: string;
  /** Exclusive upper bound (ISO 8601 UTC). Required when {@link periodFrom} is set. */
  readonly periodTo?: string;
  /**
   * Optional named token (`'mtd'`, `'qtd'`, …) — echoed in the response for
   * client convenience. The renderer never re-resolves it server-side.
   */
  readonly periodToken?: string;
  /** Active BCP-47 locale (e.g. `'en'`, `'fr-CA'`). Defaults to `'en'`. */
  readonly locale?: string;
  /**
   * Dashboard-level filter bindings (e.g. `{ Status: 'Open' }`). Each typed
   * widget renderer applies them in its own way; the renderer pipeline
   * doesn't interpret the values. `null` / missing = no filters.
   */
  readonly filters?: Readonly<Record<string, string>> | null;
}
