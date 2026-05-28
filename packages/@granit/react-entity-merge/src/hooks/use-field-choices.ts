import { resolveWinner, seedFieldChoices } from '@granit/entity-merge';
import { useCallback, useEffect, useState } from 'react';

import type { FieldConflict, MergeFieldChoices, WinnerSide } from '@granit/entity-merge';

export interface UseFieldChoicesResult {
  /** Current per-field overrides (seeded with each conflict's recommended default). */
  readonly choices: MergeFieldChoices;
  /** Effective winner for a conflict — the override if any, else the default. */
  readonly winnerFor: (conflict: FieldConflict) => WinnerSide;
  /** Set an explicit override for one field path. */
  readonly setChoice: (fieldPath: string, winner: WinnerSide) => void;
  /** Drop all overrides back to the recommended defaults. */
  readonly reset: () => void;
}

/**
 * Local UI state for per-field merge choices. Seeds each conflict's recommended
 * `default` the first time it appears (and whenever `conflicts` change) while
 * preserving manual edits made afterwards. No network — pair with
 * {@link useMergePreview} for the conflict list.
 */
export function useFieldChoices(conflicts: readonly FieldConflict[]): UseFieldChoicesResult {
  const [choices, setChoices] = useState<MergeFieldChoices>({});

  useEffect(() => {
    setChoices((prev) => seedFieldChoices(conflicts, prev));
  }, [conflicts]);

  const winnerFor = useCallback(
    (conflict: FieldConflict) => resolveWinner(conflict, choices),
    [choices]
  );

  const setChoice = useCallback((fieldPath: string, winner: WinnerSide) => {
    setChoices((prev) => ({ ...prev, [fieldPath]: winner }));
  }, []);

  const reset = useCallback(() => setChoices({}), []);

  return { choices, winnerFor, setChoice, reset };
}
