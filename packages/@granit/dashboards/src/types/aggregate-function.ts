/**
 * Aggregate functions available for grouped queries. Mirrors
 * `Granit.QueryEngine.Filtering.AggregateFunction`. Wire format is the
 * PascalCase enum name (Granit's HTTP JSON layer registers a
 * `JsonStringEnumConverter` without a naming policy).
 */
export type AggregateFunction = 'Count' | 'Sum' | 'Avg' | 'Min' | 'Max';
