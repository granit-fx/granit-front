import { toReferenceDataFormValues, toReferenceDataPayload } from '../components/form-mapping';

import type { ReferenceDataResponse } from '../components/types';
import type { CreateReferenceDataFormValues } from '../components/types';

function createValues(
  overrides: Partial<CreateReferenceDataFormValues> = {}
): CreateReferenceDataFormValues {
  return {
    code: 'INVOICE',
    labelEn: 'Invoice',
    labelFr: 'Facture',
    labelNl: '',
    labelDe: '',
    sortOrder: 1,
    activated: true,
    validFrom: '',
    validTo: '',
    parentCode: '',
    metadata: [],
    ...overrides,
  };
}

describe('toReferenceDataPayload', () => {
  it('keeps the fields the endpoint takes verbatim', () => {
    const payload = toReferenceDataPayload(createValues());

    expect(payload.code).toBe('INVOICE');
    expect(payload.labelEn).toBe('Invoice');
    expect(payload.sortOrder).toBe(1);
    expect(payload.activated).toBe(true);
  });

  it('collapses a blank parent to null', () => {
    expect(toReferenceDataPayload(createValues({ parentCode: '' })).parentCode).toBeNull();
    expect(toReferenceDataPayload(createValues({ parentCode: 'ROOT' })).parentCode).toBe('ROOT');
  });

  it('collapses a blank validity window to null rather than an empty date', () => {
    const payload = toReferenceDataPayload(createValues({ validFrom: '', validTo: '' }));

    expect(payload.validFrom).toBeNull();
    expect(payload.validTo).toBeNull();
  });

  it('passes a stated validity window through', () => {
    const payload = toReferenceDataPayload(
      createValues({ validFrom: '2026-01-01', validTo: '2026-12-31' })
    );

    expect(payload.validFrom).toBe('2026-01-01');
    expect(payload.validTo).toBe('2026-12-31');
  });

  it('turns the metadata list into a record', () => {
    const payload = toReferenceDataPayload(
      createValues({
        metadata: [
          { key: 'taxRate', value: '21' },
          { key: 'hsCode', value: '8471.30' },
        ],
      })
    );

    expect(payload.metadata).toEqual({ taxRate: '21', hsCode: '8471.30' });
  });

  it('drops metadata rows whose key is blank or whitespace', () => {
    const payload = toReferenceDataPayload(
      createValues({
        metadata: [
          { key: 'taxRate', value: '21' },
          { key: '   ', value: 'orphan' },
          { key: '', value: 'orphan' },
        ],
      })
    );

    expect(payload.metadata).toEqual({ taxRate: '21' });
  });

  it('collapses metadata to null when no row has a key', () => {
    const payload = toReferenceDataPayload(
      createValues({ metadata: [{ key: '', value: 'orphan' }] })
    );

    expect(payload.metadata).toBeNull();
  });
});

describe('toReferenceDataFormValues', () => {
  const entry = {
    labelEn: 'Invoice',
    labelFr: 'Facture',
    labelNl: 'Factuur',
    labelDe: 'Rechnung',
    sortOrder: 3,
    activated: false,
    validFrom: null,
    validTo: null,
    parentCode: null,
    metadata: null,
  } as unknown as ReferenceDataResponse;

  it('turns absent values into empty strings so inputs stay controlled', () => {
    const values = toReferenceDataFormValues(entry);

    expect(values.validFrom).toBe('');
    expect(values.validTo).toBe('');
    expect(values.parentCode).toBe('');
    expect(values.metadata).toEqual([]);
  });

  it('spreads the metadata record into editable rows', () => {
    const values = toReferenceDataFormValues({
      ...entry,
      metadata: { taxRate: '21' },
    } as unknown as ReferenceDataResponse);

    expect(values.metadata).toEqual([{ key: 'taxRate', value: '21' }]);
  });

  it('round-trips a populated entry back through toReferenceDataPayload', () => {
    const populated = {
      ...entry,
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      parentCode: 'ROOT',
      metadata: { taxRate: '21' },
    } as unknown as ReferenceDataResponse;

    const payload = toReferenceDataPayload(toReferenceDataFormValues(populated));

    expect(payload).toMatchObject({
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      parentCode: 'ROOT',
      metadata: { taxRate: '21' },
    });
  });

  it('round-trips an empty entry back to nulls', () => {
    const payload = toReferenceDataPayload(toReferenceDataFormValues(entry));

    expect(payload).toMatchObject({
      validFrom: null,
      validTo: null,
      parentCode: null,
      metadata: null,
    });
  });
});
