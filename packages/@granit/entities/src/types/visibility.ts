/**
 * Closed enum of operators allowed in the manifest's visibility DSL
 * (mirrors `Granit.Entities.Visibility.FieldOp`, ADR-040 / ADR-044).
 *
 * Deliberately small — sufficient for the conditional-visibility cases an
 * admin form needs without inviting eval-string expressions. Apps that need
 * richer logic should resolve it server-side via permissions or a domain
 * rule, not at the manifest layer.
 */
export type FieldOp = 'Eq' | 'NotEq' | 'In' | 'NotIn' | 'Gt' | 'Lt' | 'IsNull' | 'IsNotNull';

/**
 * One conditional-visibility rule, as carried by `visibleIf` on a form
 * field, detail section, or relation. Mirrors
 * `Granit.Entities.Visibility.VisibilityCondition`.
 *
 * `value` semantics by operator:
 * - `Eq` / `NotEq` / `Gt` / `Lt` — single literal
 * - `In` / `NotIn` — array of literals
 * - `IsNull` / `IsNotNull` — `value` is ignored
 *
 * `field` is the PascalCase property name on the source entity. The
 * renderer evaluates the rule against the current form's values via
 * {@link evaluateVisibility}.
 */
export interface VisibilityCondition {
  readonly field: string;
  readonly op: FieldOp;
  readonly value?: unknown;
}
