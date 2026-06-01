import { describe, expect, it } from 'vitest';

import { axiosResponse, createMockClient, createMockLogger } from '../index';

describe('@granit/react-testing re-exports', () => {
  it('re-exports createMockClient from @granit/testing', () => {
    expect(typeof createMockClient).toBe('function');
  });

  it('re-exports axiosResponse from @granit/testing', () => {
    expect(typeof axiosResponse).toBe('function');
  });

  it('re-exports createMockLogger from @granit/testing', () => {
    expect(typeof createMockLogger).toBe('function');
  });
});
