import { createSchedulingColumns } from '../components/scheduling-columns';

import { testI18n } from './test-utils';

const t = testI18n.t.bind(testI18n);

const formatDateTime = (value: string | Date) => String(value);

const defaultOptions = {
  t,
  formatDateTime,
  onCancel: vi.fn(),
  onReschedule: vi.fn(),
  isMutating: false,
  canManage: true,
};

describe('createSchedulingColumns', () => {
  it('should create the expected number of columns with manage permission', () => {
    const columns = createSchedulingColumns(defaultOptions);
    expect(columns).toHaveLength(8);
  });

  it('should create columns without actions when canManage is false', () => {
    const columns = createSchedulingColumns({ ...defaultOptions, canManage: false });
    expect(columns).toHaveLength(7);
    expect(columns.find((c) => c.id === 'actions')).toBeUndefined();
  });

  it('should have correct column IDs', () => {
    const columns = createSchedulingColumns(defaultOptions);
    const ids = columns.map((c) => c.id);
    expect(ids).toEqual([
      'view',
      'payloadType',
      'status',
      'executeAt',
      'createdAt',
      'executedAt',
      'correlationId',
      'actions',
    ]);
  });

  it('should enable sorting on sortable columns', () => {
    const columns = createSchedulingColumns(defaultOptions);
    const sortableIds = columns.filter((c) => c.enableSorting).map((c) => c.id);
    expect(sortableIds).toContain('payloadType');
    expect(sortableIds).toContain('status');
    expect(sortableIds).toContain('executeAt');
    expect(sortableIds).toContain('createdAt');
    expect(sortableIds).toContain('executedAt');
  });

  it('should disable sorting on correlationId and actions', () => {
    const columns = createSchedulingColumns(defaultOptions);
    const correlationCol = columns.find((c) => c.id === 'correlationId');
    const actionsCol = columns.find((c) => c.id === 'actions');
    expect(correlationCol?.enableSorting).toBe(false);
    expect(actionsCol?.enableSorting).toBe(false);
  });

  it('should use translated headers', () => {
    const columns = createSchedulingColumns(defaultOptions);
    const payloadCol = columns.find((c) => c.id === 'payloadType');
    expect(payloadCol?.header).toBe('Payload Type');
  });

  it('should return correct accessorKeys', () => {
    const columns = createSchedulingColumns(defaultOptions);
    const payloadCol = columns.find((c) => c.id === 'payloadType') as { accessorKey?: string };
    expect(payloadCol?.accessorKey).toBe('payloadType');
  });
});
