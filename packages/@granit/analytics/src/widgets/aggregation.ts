/**
 * Aggregation operators. Mirrors `Granit.QueryEngine.Filtering.AggregateFunction`
 * — the same enum used for metric definitions on the backend.
 */
export type AggregateFunction = 'count' | 'sum' | 'avg' | 'min' | 'max';
