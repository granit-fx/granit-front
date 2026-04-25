/**
 * Convert SmartFormat single-brace placeholders `{Foo}` to i18next
 * double-brace `{{Foo}}`, skipping values that already use double braces.
 */
function toI18nextPlaceholders(value: string): string {
  return value.replaceAll(/(?<!\{)\{([A-Za-z]\w*)\}(?!\})/g, '{{$1}}');
}

/**
 * Unflatten dot-separated keys into a nested object for i18next.
 *
 * `{ "Auth.Login.Title": "Sign in" }` → `{ Auth: { Login: { Title: "Sign in" } } }`
 *
 * Used to transform backend flat translation bundles (SmartFormat) into the
 * nested structure expected by i18next with `keySeparator: '.'`.
 */
export function unflattenKeys(flat: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, rawValue] of Object.entries(flat)) {
    const value = typeof rawValue === 'string' ? toI18nextPlaceholders(rawValue) : rawValue;

    if (!key.includes('.')) {
      result[key] = value;
      continue;
    }

    const parts = key.split('.');
    let current: Record<string, unknown> = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!;
      if (!(part in current) || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    current[parts.at(-1)!] = value;
  }

  return result;
}
