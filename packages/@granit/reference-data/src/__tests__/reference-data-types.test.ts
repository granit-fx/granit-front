import { describe, expectTypeOf, it } from 'vitest';

import type {
  ReferenceDataCreateRequest,
  ReferenceDataResponse,
  ReferenceDataQuery,
  ReferenceDataUpdateRequest,
} from '../index';
import type { ISODateString } from '@granit/types';

describe('@granit/reference-data types', () => {
  describe('ReferenceDataResponse', () => {
    it('should have a code business key', () => {
      expectTypeOf<ReferenceDataResponse>().toHaveProperty('code');
      expectTypeOf<ReferenceDataResponse['code']>().toBeString();
    });

    it('should have all 14 multilingual labels', () => {
      expectTypeOf<ReferenceDataResponse>().toHaveProperty('labelEn');
      expectTypeOf<ReferenceDataResponse>().toHaveProperty('labelFr');
      expectTypeOf<ReferenceDataResponse>().toHaveProperty('labelNl');
      expectTypeOf<ReferenceDataResponse>().toHaveProperty('labelDe');
      expectTypeOf<ReferenceDataResponse>().toHaveProperty('labelEs');
      expectTypeOf<ReferenceDataResponse>().toHaveProperty('labelIt');
      expectTypeOf<ReferenceDataResponse>().toHaveProperty('labelPt');
      expectTypeOf<ReferenceDataResponse>().toHaveProperty('labelZh');
      expectTypeOf<ReferenceDataResponse>().toHaveProperty('labelJa');
      expectTypeOf<ReferenceDataResponse>().toHaveProperty('labelPl');
      expectTypeOf<ReferenceDataResponse>().toHaveProperty('labelTr');
      expectTypeOf<ReferenceDataResponse>().toHaveProperty('labelKo');
      expectTypeOf<ReferenceDataResponse>().toHaveProperty('labelSv');
      expectTypeOf<ReferenceDataResponse>().toHaveProperty('labelCs');
    });

    it('should have a server-computed label', () => {
      expectTypeOf<ReferenceDataResponse>().toHaveProperty('label');
      expectTypeOf<ReferenceDataResponse['label']>().toBeString();
    });

    it('should have active status, sort order, and validity period', () => {
      expectTypeOf<ReferenceDataResponse['activated']>().toBeBoolean();
      expectTypeOf<ReferenceDataResponse['sortOrder']>().toBeNumber();
      expectTypeOf<ReferenceDataResponse['validFrom']>().toEqualTypeOf<ISODateString | null>();
      expectTypeOf<ReferenceDataResponse['validTo']>().toEqualTypeOf<ISODateString | null>();
    });

    it('should have hierarchical parent code', () => {
      expectTypeOf<ReferenceDataResponse['parentCode']>().toEqualTypeOf<string | null>();
    });

    it('should have extra properties bag', () => {
      expectTypeOf<ReferenceDataResponse['metadata']>().toEqualTypeOf<Record<
        string,
        string
      > | null>();
    });

    it('should have a unique id', () => {
      expectTypeOf<ReferenceDataResponse>().toHaveProperty('id');
      expectTypeOf<ReferenceDataResponse['id']>().toBeString();
    });

    it('should be extensible by concrete entity types', () => {
      interface Country extends ReferenceDataResponse {
        readonly alpha3: string;
        readonly region: string;
      }

      expectTypeOf<Country>().toMatchTypeOf<ReferenceDataResponse>();
      expectTypeOf<Country>().toHaveProperty('alpha3');
      expectTypeOf<Country>().toHaveProperty('code');
    });
  });

  describe('ReferenceDataCreateRequest', () => {
    it('should require code and labelEn', () => {
      expectTypeOf<ReferenceDataCreateRequest>().toHaveProperty('code');
      expectTypeOf<ReferenceDataCreateRequest['code']>().toBeString();
      expectTypeOf<ReferenceDataCreateRequest>().toHaveProperty('labelEn');
      expectTypeOf<ReferenceDataCreateRequest['labelEn']>().toBeString();
    });

    it('should have optional secondary labels', () => {
      expectTypeOf<ReferenceDataCreateRequest['labelFr']>().toEqualTypeOf<string | undefined>();
      expectTypeOf<ReferenceDataCreateRequest['labelNl']>().toEqualTypeOf<string | undefined>();
    });

    it('should have optional sortOrder and validity dates', () => {
      expectTypeOf<ReferenceDataCreateRequest['sortOrder']>().toEqualTypeOf<number | undefined>();
      expectTypeOf<ReferenceDataCreateRequest['validFrom']>().toEqualTypeOf<
        ISODateString | null | undefined
      >();
    });

    it('should have optional parentCode and metadata', () => {
      expectTypeOf<ReferenceDataCreateRequest['parentCode']>().toEqualTypeOf<
        string | null | undefined
      >();
      expectTypeOf<ReferenceDataCreateRequest['metadata']>().toEqualTypeOf<
        Record<string, string> | null | undefined
      >();
    });

    it('should not have activated (always true on creation)', () => {
      expectTypeOf<ReferenceDataCreateRequest>().not.toHaveProperty('activated');
    });
  });

  describe('ReferenceDataUpdateRequest', () => {
    it('should require labelEn', () => {
      expectTypeOf<ReferenceDataUpdateRequest['labelEn']>().toBeString();
    });

    it('should not have code (immutable, passed as path param)', () => {
      expectTypeOf<ReferenceDataUpdateRequest>().not.toHaveProperty('code');
    });

    it('should have optional activated for reactivation', () => {
      expectTypeOf<ReferenceDataUpdateRequest['activated']>().toEqualTypeOf<boolean | undefined>();
    });

    it('should have optional parentCode and metadata', () => {
      expectTypeOf<ReferenceDataUpdateRequest['parentCode']>().toEqualTypeOf<
        string | null | undefined
      >();
      expectTypeOf<ReferenceDataUpdateRequest['metadata']>().toEqualTypeOf<
        Record<string, string> | null | undefined
      >();
    });
  });

  describe('ReferenceDataQuery', () => {
    it('should have all optional query parameters', () => {
      expectTypeOf<ReferenceDataQuery['activeOnly']>().toEqualTypeOf<boolean | undefined>();
      expectTypeOf<ReferenceDataQuery['search']>().toEqualTypeOf<string | undefined>();
      expectTypeOf<ReferenceDataQuery['sortBy']>().toEqualTypeOf<string | undefined>();
      expectTypeOf<ReferenceDataQuery['descending']>().toEqualTypeOf<boolean | undefined>();
      expectTypeOf<ReferenceDataQuery['page']>().toEqualTypeOf<number | undefined>();
      expectTypeOf<ReferenceDataQuery['pageSize']>().toEqualTypeOf<number | undefined>();
    });
  });
});
