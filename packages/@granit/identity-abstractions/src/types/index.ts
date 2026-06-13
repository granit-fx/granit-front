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
