/**
 * Form-values shape for the template metadata form. Mirrors the
 * `SaveTemplateRequest` contract fields the form edits. Validation itself is
 * spec-driven via `createConstraintsResolver(templatingConstraints.SaveTemplateRequest)`
 * in `template-form.tsx` (see the client-only augmentations documented there);
 * this file only carries the typed shape consumed by the pages and tests.
 */
export interface TemplateFormValues {
  readonly name: string;
  readonly culture?: string | null;
  readonly layoutName?: string | null;
  readonly content: string;
  readonly mimeType: string;
}
