// ---------------------------------------------------------------------------
// Breadcrumb
// ---------------------------------------------------------------------------

/** A breadcrumb represents a significant event leading up to an error. */
export type Breadcrumb = {
  /** Category of the breadcrumb (e.g. `"navigation"`, `"user"`, `"api"`). */
  category: string;
  /** Human-readable description. */
  message: string;
  /** Timestamp of the breadcrumb (ISO 8601). */
  timestamp: string;
};

// ---------------------------------------------------------------------------
// Error context
// ---------------------------------------------------------------------------

/** Configuration for the `ErrorContextProvider`. */
export type ErrorContextConfig = {
  /** Returns the current route path for error enrichment. */
  getRouteInfo?: () => string;
  /** Returns the current user identity for error enrichment, or `undefined`
   * when no user is authenticated. */
  getUserInfo?: () => { id: string } | undefined;
  /** Maximum number of breadcrumbs to retain (FIFO). Default: `20`. */
  maxBreadcrumbs?: number;
};

/** The value exposed by `ErrorContextProvider` via React context. */
export type ErrorContextValue = {
  /** The current breadcrumb trail. */
  readonly breadcrumbs: readonly Breadcrumb[];
  /** Add a breadcrumb to the trail. */
  addBreadcrumb: (category: string, message: string) => void;
  /** Returns current route info, if configured. */
  getRouteInfo: () => string | undefined;
  /** Returns current user info, if configured. */
  getUserInfo: () => { id: string } | undefined;
};
