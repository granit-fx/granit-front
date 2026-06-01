import { describe, expectTypeOf, it } from 'vitest';

import type { BackgroundJobListParams, BackgroundJobStatus } from '../index';

describe('@granit/background-jobs types', () => {
  describe('BackgroundJobListParams', () => {
    it('should have optional page field', () => {
      expectTypeOf<BackgroundJobListParams>().toHaveProperty('page');
      expectTypeOf<BackgroundJobListParams['page']>().toEqualTypeOf<number | undefined>();
    });

    it('should have optional pageSize field', () => {
      expectTypeOf<BackgroundJobListParams>().toHaveProperty('pageSize');
      expectTypeOf<BackgroundJobListParams['pageSize']>().toEqualTypeOf<number | undefined>();
    });
  });

  describe('BackgroundJobStatus', () => {
    it('should have job identification fields', () => {
      expectTypeOf<BackgroundJobStatus>().toHaveProperty('jobName');
      expectTypeOf<BackgroundJobStatus['jobName']>().toBeString();
      expectTypeOf<BackgroundJobStatus>().toHaveProperty('cronExpression');
      expectTypeOf<BackgroundJobStatus['cronExpression']>().toBeString();
    });

    it('should have enabled flag', () => {
      expectTypeOf<BackgroundJobStatus>().toHaveProperty('isEnabled');
      expectTypeOf<BackgroundJobStatus['isEnabled']>().toBeBoolean();
    });

    it('should have execution timing fields', () => {
      expectTypeOf<BackgroundJobStatus>().toHaveProperty('lastExecutedAt');
      expectTypeOf<BackgroundJobStatus>().toHaveProperty('nextExecutionAt');
    });

    it('should have error tracking fields', () => {
      expectTypeOf<BackgroundJobStatus>().toHaveProperty('consecutiveFailures');
      expectTypeOf<BackgroundJobStatus['consecutiveFailures']>().toBeNumber();
      expectTypeOf<BackgroundJobStatus>().toHaveProperty('deadLetterCount');
      expectTypeOf<BackgroundJobStatus['deadLetterCount']>().toBeNumber();
      expectTypeOf<BackgroundJobStatus>().toHaveProperty('lastError');
    });
  });
});
