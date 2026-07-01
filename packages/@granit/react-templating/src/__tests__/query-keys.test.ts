import { describe, expect, it } from 'vitest';

import { templatingKeys } from '../hooks/query-keys';

const prefix = ['admin', 'templates'] as const;

describe('templatingKeys', () => {
  it('should build all key', () => {
    expect(templatingKeys.all(prefix)).toEqual(['admin', 'templates']);
  });

  it('should build lists key', () => {
    expect(templatingKeys.lists(prefix)).toEqual(['admin', 'templates', 'list']);
  });

  it('should build list key with params', () => {
    expect(templatingKeys.list(prefix, { status: 0, page: 1 })).toEqual([
      'admin',
      'templates',
      'list',
      { status: 0, page: 1 },
    ]);
  });

  it('should build detail key', () => {
    expect(templatingKeys.detail(prefix, 'Billing.Invoice')).toEqual([
      'admin',
      'templates',
      'detail',
      'Billing.Invoice',
    ]);
  });

  it('should build history key', () => {
    expect(templatingKeys.history(prefix, 'Billing.Invoice')).toEqual([
      'admin',
      'templates',
      'history',
      'Billing.Invoice',
    ]);
  });

  it('should build revision key', () => {
    expect(templatingKeys.revision(prefix, 'Billing.Invoice', 'rev-1')).toEqual([
      'admin',
      'templates',
      'revision',
      'Billing.Invoice',
      'rev-1',
    ]);
  });

  it('should build variables key', () => {
    expect(templatingKeys.variables(prefix, 'Billing.Invoice')).toEqual([
      'admin',
      'templates',
      'variables',
      'Billing.Invoice',
    ]);
  });

  it('should build lifecycle key', () => {
    expect(templatingKeys.lifecycle(prefix, 'Billing.Invoice')).toEqual([
      'admin',
      'templates',
      'lifecycle',
      'Billing.Invoice',
    ]);
  });

  it('should build layouts key', () => {
    expect(templatingKeys.layouts(prefix)).toEqual(['admin', 'templates', 'layouts']);
  });

  it('should build categories key', () => {
    expect(templatingKeys.categories(prefix)).toEqual(['admin', 'templates', 'categories']);
  });
});
