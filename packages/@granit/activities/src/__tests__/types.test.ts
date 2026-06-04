import { describe, expectTypeOf, it } from 'vitest';

import type {
  ActivityCalendarColor,
  ActivityCalendarItemResponse,
  ActivityListResponse,
  ActivityResponse,
  ActivityStatus,
  ActivityStatusFilter,
} from '../types/index';

describe('Activity types', () => {
  it('ActivityStatus is the closed PascalCase union shipped by the backend', () => {
    expectTypeOf<ActivityStatus>().toEqualTypeOf<'Open' | 'Done' | 'Cancelled'>();
  });

  it('ActivityStatusFilter mirrors the backend filter enum (no All; OpenOrOverdue, not Open)', () => {
    expectTypeOf<ActivityStatusFilter>().toEqualTypeOf<'OpenOrOverdue' | 'Done' | 'Cancelled'>();
  });

  it('ActivityCalendarColor mirrors the lowercase server-mapped values', () => {
    expectTypeOf<ActivityCalendarColor>().toEqualTypeOf<
      'open' | 'overdue' | 'done' | 'cancelled'
    >();
  });

  it('ActivityResponse fields are readonly and audit timestamps are nullable', () => {
    expectTypeOf<ActivityResponse>().toMatchTypeOf<{
      readonly id: string;
      readonly status: ActivityStatus;
      readonly dueAt: string;
      readonly completedAt: string | null;
      readonly completedByUserId: string | null;
    }>();
  });

  it('ActivityListResponse exposes a readonly items array + pagination metadata', () => {
    expectTypeOf<ActivityListResponse>().toMatchTypeOf<{
      readonly items: readonly ActivityResponse[];
      readonly totalCount: number;
      readonly page: number;
      readonly pageSize: number;
    }>();
  });

  it('ActivityCalendarItemResponse uses the server-supplied color (no client recompute)', () => {
    expectTypeOf<ActivityCalendarItemResponse['color']>().toEqualTypeOf<ActivityCalendarColor>();
  });
});
