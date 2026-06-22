/** Title-cases a form field name to match the `Catalog.Fields.*` key suffix. */
export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
