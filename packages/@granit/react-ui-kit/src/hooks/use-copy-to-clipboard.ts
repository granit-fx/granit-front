import { useCallback, useState } from 'react';

const COPIED_RESET_MS = 2000;

/**
 * Returns a `copy(text)` function and a `copied` boolean that is true for
 * 2 seconds after a successful write.  Safe to call when
 * `navigator.clipboard` is unavailable (HTTPS only, or non-browser env).
 */
export function useCopyToClipboard(): { copy: (text: string) => Promise<void>; copied: boolean } {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string): Promise<void> => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    globalThis.setTimeout(() => setCopied(false), COPIED_RESET_MS);
  }, []);

  return { copy, copied };
}
