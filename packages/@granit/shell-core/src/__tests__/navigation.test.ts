import { filterNavByPermission } from '../navigation';

interface Item {
  href: string;
  permission?: string;
}

describe('filterNavByPermission', () => {
  const items: Item[] = [
    { href: '/public' },
    { href: '/users', permission: 'users.read' },
    { href: '/billing', permission: 'billing.read' },
  ];

  it('keeps items without a permission regardless of the predicate', () => {
    const result = filterNavByPermission(items, () => false);
    expect(result).toEqual([{ href: '/public' }]);
  });

  it('keeps gated items only when the permission is granted', () => {
    const granted = new Set(['users.read']);
    const result = filterNavByPermission(items, (p) => granted.has(p));
    expect(result.map((i) => i.href)).toEqual(['/public', '/users']);
  });

  it('keeps every item when all permissions are granted', () => {
    expect(filterNavByPermission(items, () => true)).toHaveLength(3);
  });

  it('preserves the original order', () => {
    const result = filterNavByPermission(items, () => true);
    expect(result.map((i) => i.href)).toEqual(['/public', '/users', '/billing']);
  });

  it('returns an empty array for empty input', () => {
    expect(filterNavByPermission([], () => true)).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const input = [...items];
    filterNavByPermission(input, () => false);
    expect(input).toHaveLength(3);
  });
});
