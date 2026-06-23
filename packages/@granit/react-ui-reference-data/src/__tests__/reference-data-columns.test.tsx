import { createReferenceDataColumns } from '../components/reference-data-columns';

import { testI18n } from './test-utils';

const t = testI18n.t.bind(testI18n);

const defaultOptions = {
  t,
  onEdit: vi.fn(),
  onDeactivate: vi.fn(),
  onReactivate: vi.fn(),
};

describe('createReferenceDataColumns', () => {
  it('should create the expected columns', () => {
    const columns = createReferenceDataColumns(defaultOptions);
    expect(columns.map((c) => c.id)).toEqual([
      'code',
      'labelEn',
      'activated',
      'metadata',
      'actions',
    ]);
  });

  it('should enable sorting only on code and labelEn', () => {
    const columns = createReferenceDataColumns(defaultOptions);
    const sortableIds = columns.filter((c) => c.enableSorting).map((c) => c.id);
    expect(sortableIds).toEqual(['code', 'labelEn']);
  });

  it('should resolve headers from the default ReferenceData.Common prefix', () => {
    const columns = createReferenceDataColumns(defaultOptions);
    const codeCol = columns.find((c) => c.id === 'code');
    expect(codeCol?.header).toBe('Code');
    const metadataCol = columns.find((c) => c.id === 'metadata');
    expect(metadataCol?.header).toBe('Properties');
  });

  it('should honour a custom i18nPrefix', () => {
    const columns = createReferenceDataColumns({ ...defaultOptions, i18nPrefix: 'Countries' });
    const codeCol = columns.find((c) => c.id === 'code');
    // The Countries prefix is not registered in the test bundle, so the raw key
    // string is rendered verbatim (flat-key lookup) — proving the prefix is used.
    expect(codeCol?.header).toBe('Countries.Columns.Code');
  });
});
