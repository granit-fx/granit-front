/**
 * Coarse classification used by the dashboard catalog UI to group dashboards.
 *
 * Kept as a plain union (not an enum) so consumers can extend it via TypeScript
 * declaration merging or simply pass any string the host has registered.
 */
export type DashboardCategory =
  | 'business'
  | 'operations'
  | 'iot'
  | 'compliance'
  | 'finance'
  | 'general'
  | (string & {});
