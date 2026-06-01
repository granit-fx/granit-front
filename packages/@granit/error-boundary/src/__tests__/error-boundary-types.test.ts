import { describe, expectTypeOf, it } from 'vitest';

import type { Breadcrumb, ErrorContextConfig, ErrorContextValue } from '../index';

describe('@granit/error-boundary types', () => {
  describe('Breadcrumb', () => {
    it('should have category, message, and timestamp', () => {
      expectTypeOf<Breadcrumb>().toHaveProperty('category');
      expectTypeOf<Breadcrumb['category']>().toBeString();
      expectTypeOf<Breadcrumb>().toHaveProperty('message');
      expectTypeOf<Breadcrumb['message']>().toBeString();
      expectTypeOf<Breadcrumb>().toHaveProperty('timestamp');
      expectTypeOf<Breadcrumb['timestamp']>().toBeString();
    });
  });

  describe('ErrorContextConfig', () => {
    it('should have optional getRouteInfo and getUserInfo', () => {
      expectTypeOf<ErrorContextConfig>().toHaveProperty('getRouteInfo');
      expectTypeOf<ErrorContextConfig>().toHaveProperty('getUserInfo');
    });

    it('should have optional maxBreadcrumbs', () => {
      expectTypeOf<ErrorContextConfig>().toHaveProperty('maxBreadcrumbs');
    });
  });

  describe('ErrorContextValue', () => {
    it('should expose breadcrumbs trail', () => {
      expectTypeOf<ErrorContextValue>().toHaveProperty('breadcrumbs');
    });

    it('should expose addBreadcrumb method', () => {
      expectTypeOf<ErrorContextValue>().toHaveProperty('addBreadcrumb');
      expectTypeOf<ErrorContextValue['addBreadcrumb']>().toBeFunction();
    });

    it('should expose context accessor methods', () => {
      expectTypeOf<ErrorContextValue>().toHaveProperty('getRouteInfo');
      expectTypeOf<ErrorContextValue['getRouteInfo']>().toBeFunction();
      expectTypeOf<ErrorContextValue>().toHaveProperty('getUserInfo');
      expectTypeOf<ErrorContextValue['getUserInfo']>().toBeFunction();
    });
  });
});
