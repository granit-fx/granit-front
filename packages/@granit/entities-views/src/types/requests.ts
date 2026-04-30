/**
 * Request body for `POST /entities/{name}/views`. Mirrors
 * `Granit.Entities.Views.Endpoints.Dtos.EntityViewCreateBodyRequest`.
 */
export interface EntityViewCreateBodyRequest {
  /** Compiled-collection name this view deltas over. */
  readonly basedOn: string;
  /** View kind inherited from `basedOn`. */
  readonly kind: string;
  readonly name: string;
  readonly description: string | null;
  readonly icon: string | null;
  /** JSON delta payload. */
  readonly state: Readonly<Record<string, unknown>>;
}

/**
 * Request body for `PUT /entities/{name}/views/{id}`. Mirrors
 * `Granit.Entities.Views.Endpoints.Dtos.EntityViewUpdateBodyRequest`.
 *
 * `basedOn` and `kind` are immutable post-creation, so they're absent
 * here; `state` is validated server-side against the existing `kind`.
 */
export interface EntityViewUpdateBodyRequest {
  readonly name: string;
  readonly description: string | null;
  readonly icon: string | null;
  readonly state: Readonly<Record<string, unknown>>;
}

/**
 * Request body for `POST /entities/{name}/views/{id}/share`. Mirrors
 * `Granit.Entities.Views.Endpoints.Dtos.EntityViewShareBodyRequest`.
 */
export interface EntityViewShareBodyRequest {
  readonly roles: readonly string[];
  readonly users: readonly string[];
}

/**
 * Request body for the boolean-toggle endpoints (pin / star /
 * set-default). Mirrors
 * `Granit.Entities.Views.Endpoints.Dtos.EntityViewToggleFlagRequest`.
 */
export interface EntityViewToggleFlagRequest {
  readonly value: boolean;
}
