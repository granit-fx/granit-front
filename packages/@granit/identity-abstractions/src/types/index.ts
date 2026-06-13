/**
 * Coarse risk classification for a user session, surfaced to users and used to
 * drive security responses (notifications, step-up authentication). Mirrors
 * `Granit.Identity.Abstractions.UserSessionRiskLevel`, serialized as its string name via
 * the framework's `JsonStringEnumConverter`.
 *
 * `'None'` means anomaly detection ran and found nothing; a *null* risk level on
 * a session means no verdict was stored (detection not installed).
 */
export type UserSessionRiskLevel = 'None' | 'Low' | 'Medium' | 'High';

/**
 * The kind of client a session or device represents. Mirrors
 * `Granit.Identity.DeviceKind`, serialized as its string name via the
 * framework's `JsonStringEnumConverter`.
 *
 * Determined by the authentication context — the OIDC client's declared kind,
 * with a heuristic fallback (redirect-URI scheme, grant type) — not by
 * User-Agent parsing. The client composes a localized device label from this
 * together with the operating-system and browser families.
 *
 * - `'Unknown'` — unknown or not yet classified.
 * - `'Browser'` — a web browser or single-page app (cookie / BFF session).
 * - `'BrowserExtension'` — a browser extension with its own OIDC client.
 * - `'MobileApp'` — a native smartphone or tablet application.
 * - `'DesktopApp'` — a native desktop application.
 * - `'Wearable'` — a wrist-worn companion device (smartwatch).
 * - `'Tv'` — a TV, set-top box or other input-constrained device.
 * - `'Embedded'` — an embedded physical device (IoT, point-of-sale, industrial).
 * - `'ApiClient'` — a CLI, service or machine client.
 */
export type DeviceKind =
  | 'Unknown'
  | 'Browser'
  | 'BrowserExtension'
  | 'MobileApp'
  | 'DesktopApp'
  | 'Wearable'
  | 'Tv'
  | 'Embedded'
  | 'ApiClient';
