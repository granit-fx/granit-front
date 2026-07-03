// The timezone brand lives in @granit/types (the shared brand vocabulary);
// re-exported here so consumers of the resolver get it from one import.
export { isTimeZoneId, toTimeZoneId } from '@granit/types';
export type { TimeZoneId } from '@granit/types';

export type { Weekday } from './weekday';

// Calendar-token resolution — client-side mirror of Granit.Timing.PeriodResolver.
export { resolvePeriodToken } from './resolve-period-token';
export type { PeriodBounds, ResolvePeriodTokenOptions } from './resolve-period-token';
