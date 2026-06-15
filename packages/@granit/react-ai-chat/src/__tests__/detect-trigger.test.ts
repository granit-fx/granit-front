import { describe, expect, it } from 'vitest';

import { detectTrigger } from '../components/detect-trigger';

describe('detectTrigger', () => {
  it('detects a / at the start of the input', () => {
    expect(detectTrigger('/sum', 4)).toEqual({ kind: '/', query: 'sum', start: 0 });
  });

  it('detects an @ after whitespace', () => {
    expect(detectTrigger('hi @ali', 7)).toEqual({ kind: '@', query: 'ali', start: 3 });
  });

  it('returns null when the trigger is mid-word (e.g. an email)', () => {
    expect(detectTrigger('me@example', 10)).toBeNull();
  });

  it('returns null once the query contains whitespace', () => {
    expect(detectTrigger('/daily brief', 12)).toBeNull();
  });

  it('returns null when there is no trigger before the caret', () => {
    expect(detectTrigger('just text', 9)).toBeNull();
  });

  it('uses the caret position, not the end of the text', () => {
    expect(detectTrigger('/sum extra', 4)).toEqual({ kind: '/', query: 'sum', start: 0 });
  });
});
