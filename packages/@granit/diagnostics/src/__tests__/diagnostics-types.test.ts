import { describe, expectTypeOf, it } from 'vitest';

import type { MonitoringHealthResponse, ServiceHealth, ServiceStatus } from '../index';

describe('@granit/diagnostics types', () => {
  describe('ServiceStatus', () => {
    it('should be a union of health states', () => {
      expectTypeOf<ServiceStatus>().toEqualTypeOf<'healthy' | 'degraded' | 'down'>();
    });
  });

  describe('ServiceHealth', () => {
    it('should have identification fields', () => {
      expectTypeOf<ServiceHealth>().toHaveProperty('id');
      expectTypeOf<ServiceHealth['id']>().toBeString();
      expectTypeOf<ServiceHealth>().toHaveProperty('name');
      expectTypeOf<ServiceHealth['name']>().toBeString();
    });

    it('should have status field', () => {
      expectTypeOf<ServiceHealth>().toHaveProperty('status');
      expectTypeOf<ServiceHealth['status']>().toEqualTypeOf<ServiceStatus>();
    });

    it('should have nullable responseTimeMs', () => {
      expectTypeOf<ServiceHealth>().toHaveProperty('responseTimeMs');
      expectTypeOf<ServiceHealth['responseTimeMs']>().toEqualTypeOf<number | null>();
    });

    it('should have nullable description', () => {
      expectTypeOf<ServiceHealth>().toHaveProperty('description');
      expectTypeOf<ServiceHealth['description']>().toEqualTypeOf<string | null>();
    });

    it('should have readonly tags array', () => {
      expectTypeOf<ServiceHealth>().toHaveProperty('tags');
      expectTypeOf<ServiceHealth['tags']>().toEqualTypeOf<readonly string[]>();
    });
  });

  describe('MonitoringHealthResponse', () => {
    it('should have readonly services array', () => {
      expectTypeOf<MonitoringHealthResponse>().toHaveProperty('services');
      expectTypeOf<MonitoringHealthResponse['services']>().toEqualTypeOf<
        readonly ServiceHealth[]
      >();
    });

    it('should have checkedAt timestamp', () => {
      expectTypeOf<MonitoringHealthResponse>().toHaveProperty('checkedAt');
      expectTypeOf<MonitoringHealthResponse['checkedAt']>().toBeString();
    });
  });
});
