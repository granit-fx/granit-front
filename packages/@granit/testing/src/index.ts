// ---------------------------------------------------------------------------
// @granit/testing — Shared test utilities for @granit/* packages
// ---------------------------------------------------------------------------

export { axiosResponse, createMockClient } from './mock-client';
export { createMockLogger } from './mock-logger';

export type { MockLogger } from './mock-logger';

/**
 * Strip `readonly` modifiers from all properties of `T`.
 * Used in testing data files to allow mutation of otherwise readonly mock objects.
 */
export type Mutable<T> = { -readonly [K in keyof T]: T[K] };
