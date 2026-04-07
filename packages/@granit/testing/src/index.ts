// ---------------------------------------------------------------------------
// @granit/testing — Shared test utilities for @granit/* packages
// ---------------------------------------------------------------------------

export { axiosResponse, createMockClient } from './mock-client.js';
export { createMockLogger } from './mock-logger.js';

export type { MockLogger } from './mock-logger.js';

/**
 * Strip `readonly` modifiers from all properties of `T`.
 * Used in testing data files to allow mutation of otherwise readonly mock objects.
 */
export type Mutable<T> = { -readonly [K in keyof T]: T[K] };
