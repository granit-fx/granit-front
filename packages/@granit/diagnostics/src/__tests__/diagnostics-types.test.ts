import { describe, expectTypeOf, it } from 'vitest';

import type { MonitoringHealthResponse, ServiceHealthResponse, ServiceStatus } from '../index';

describe('@granit/diagnostics types', () => {
  describe('ServiceStatus', () => {
    it('should be a union of health states', () => {
      expectTypeOf<ServiceStatus>().toEqualTypeOf<'healthy' | 'degraded' | 'down'>();
    });
  });

  describe('ServiceHealthResponse', () => {
    it('should have identification fields', () => {
      expectTypeOf<ServiceHealthResponse>().toHaveProperty('id');
      expectTypeOf<ServiceHealthResponse['id']>().toBeString();
      expectTypeOf<ServiceHealthResponse>().toHaveProperty('name');
      expectTypeOf<ServiceHealthResponse['name']>().toBeString();
    });

    it('should have status field', () => {
      expectTypeOf<ServiceHealthResponse>().toHaveProperty('status');
      expectTypeOf<ServiceHealthResponse['status']>().toEqualTypeOf<ServiceStatus>();
    });

    it('should have nullable responseTimeMs', () => {
      expectTypeOf<ServiceHealthResponse>().toHaveProperty('responseTimeMs');
      expectTypeOf<ServiceHealthResponse['responseTimeMs']>().toEqualTypeOf<number | null>();
    });

    it('should have nullable description', () => {
      expectTypeOf<ServiceHealthResponse>().toHaveProperty('description');
      expectTypeOf<ServiceHealthResponse['description']>().toEqualTypeOf<string | null>();
    });

    it('should have readonly tags array', () => {
      expectTypeOf<ServiceHealthResponse>().toHaveProperty('tags');
      expectTypeOf<ServiceHealthResponse['tags']>().toEqualTypeOf<readonly string[]>();
    });
  });

  describe('MonitoringHealthResponse', () => {
    it('should have readonly services array', () => {
      expectTypeOf<MonitoringHealthResponse>().toHaveProperty('services');
      expectTypeOf<MonitoringHealthResponse['services']>().toEqualTypeOf<
        readonly ServiceHealthResponse[]
      >();
    });

    it('should have checkedAt timestamp', () => {
      expectTypeOf<MonitoringHealthResponse>().toHaveProperty('checkedAt');
      expectTypeOf<MonitoringHealthResponse['checkedAt']>().toBeString();
    });
  });
});
