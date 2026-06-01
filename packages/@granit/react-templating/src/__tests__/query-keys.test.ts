import { describe, expect, it } from 'vitest';

import { templateKeys } from '../hooks/query-keys';

const prefix = ['admin', 'templates'] as const;

describe('templateKeys', () => {
  it('should build all key', () => {
    expect(templateKeys.all(prefix)).toEqual(['admin', 'templates']);
  });

  it('should build lists key', () => {
    expect(templateKeys.lists(prefix)).toEqual(['admin', 'templates', 'list']);
  });

  it('should build list key with params', () => {
    expect(templateKeys.list(prefix, { status: 0, page: 1 })).toEqual([
      'admin',
      'templates',
      'list',
      { status: 0, page: 1 },
    ]);
  });

  it('should build detail key', () => {
    expect(templateKeys.detail(prefix, 'Billing.Invoice')).toEqual([
      'admin',
      'templates',
      'detail',
      'Billing.Invoice',
    ]);
  });

  it('should build history key', () => {
    expect(templateKeys.history(prefix, 'Billing.Invoice')).toEqual([
      'admin',
      'templates',
      'history',
      'Billing.Invoice',
    ]);
  });

  it('should build revision key', () => {
    expect(templateKeys.revision(prefix, 'Billing.Invoice', 'rev-1')).toEqual([
      'admin',
      'templates',
      'revision',
      'Billing.Invoice',
      'rev-1',
    ]);
  });

  it('should build variables key', () => {
    expect(templateKeys.variables(prefix, 'Billing.Invoice')).toEqual([
      'admin',
      'templates',
      'variables',
      'Billing.Invoice',
    ]);
  });

  it('should build lifecycle key', () => {
    expect(templateKeys.lifecycle(prefix, 'Billing.Invoice')).toEqual([
      'admin',
      'templates',
      'lifecycle',
      'Billing.Invoice',
    ]);
  });

  it('should build layouts key', () => {
    expect(templateKeys.layouts(prefix)).toEqual(['admin', 'templates', 'layouts']);
  });

  it('should build categories key', () => {
    expect(templateKeys.categories(prefix)).toEqual(['admin', 'templates', 'categories']);
  });
});
