/** An active `/` (prompt) or `@` (mention) token ending at the caret. */
export interface ActiveTrigger {
  readonly kind: '/' | '@';
  /** Text typed after the trigger char, up to the caret (no whitespace). */
  readonly query: string;
  /** Index of the trigger char in the text. */
  readonly start: number;
}

const WHITESPACE = /\s/;

/**
 * Detect a `/` or `@` autocomplete token ending at `caret`. A trigger is active
 * only at the start of the input or directly after whitespace, and its query
 * may not contain whitespace (typing a space dismisses the picker).
 */
export function detectTrigger(text: string, caret: number): ActiveTrigger | null {
  for (let i = caret - 1; i >= 0; i--) {
    const ch = text[i]!;
    if (ch === '/' || ch === '@') {
      const prev = i > 0 ? text[i - 1] : undefined;
      if (prev !== undefined && !WHITESPACE.test(prev)) return null;
      const query = text.slice(i + 1, caret);
      if (WHITESPACE.test(query)) return null;
      return { kind: ch, query, start: i };
    }
    if (WHITESPACE.test(ch)) return null;
  }
  return null;
}
