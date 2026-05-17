import { describe, expectTypeOf, it } from 'vitest';

import type {
  ActivityCalendarColor,
  ActivityCalendarItemResponse,
  ActivityListResponse,
  ActivityResponse,
  ActivityStatus,
  ActivityStatusFilter,
} from '../types/index.js';

describe('Activity types', () => {
  it('ActivityStatus is the closed PascalCase union shipped by the backend', () => {
    expectTypeOf<ActivityStatus>().toEqualTypeOf<'Open' | 'Completed' | 'Cancelled' | 'Overdue'>();
  });

  it('ActivityStatusFilter widens ActivityStatus with All + OpenOrOverdue', () => {
    expectTypeOf<ActivityStatusFilter>().toEqualTypeOf<
      'Open' | 'Completed' | 'Cancelled' | 'Overdue' | 'All' | 'OpenOrOverdue'
    >();
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
