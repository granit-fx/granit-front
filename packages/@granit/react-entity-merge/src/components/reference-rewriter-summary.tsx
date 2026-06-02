/** Localized labels for {@link ReferenceRewriterSummary}. */
export interface ReferenceRewriterSummaryLabels {
  /** Shown when there is nothing to rewrite (all counts zero / empty). */
  readonly empty: string;
}

export interface ReferenceRewriterSummaryProps {
  /** Row counts keyed by rewriter description (`"Invoice.PartyId"`, …). */
  readonly rewriteCounts: Readonly<Record<string, number>>;
  readonly labels: ReferenceRewriterSummaryLabels;
  /** Map a rewriter key to a human label. Defaults to the key itself. */
  readonly translateLabel?: (key: string) => string;
  /** Render the per-rewriter row count (handles pluralization). Defaults to `String`. */
  readonly translateRows?: (count: number) => string;
}

/**
 * Headless "what will be rewritten" recap from a {@link MergeResult.rewriteCounts}
 * map. Lists only rewriters with a non-zero count; shows an empty-state label
 * when nothing would change.
 */
export function ReferenceRewriterSummary({
  rewriteCounts,
  labels,
  translateLabel = (key) => key,
  translateRows = String,
}: Readonly<ReferenceRewriterSummaryProps>) {
  const visible = Object.entries(rewriteCounts).filter(([, count]) => count > 0);
  if (visible.length === 0) {
    return <p className="text-sm text-muted-foreground">{labels.empty}</p>;
  }
  return (
    <ul data-slot="rewrite-counts" className="space-y-1 text-sm">
      {visible.map(([key, count]) => (
        <li key={key} className="flex justify-between gap-2">
          <span>{translateLabel(key)}</span>
          <span className="font-mono">{translateRows(count)}</span>
        </li>
      ))}
    </ul>
  );
}
