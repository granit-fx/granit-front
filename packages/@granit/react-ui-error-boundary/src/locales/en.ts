/**
 * English strings for the error UI. Flat `Errors.*` keys in the `translation`
 * namespace (the host registers them with separators disabled, so the dotted
 * keys are looked up verbatim). Named with the `errorBoundary` prefix to avoid
 * colliding with other packages' translation symbols.
 */
export const errorBoundaryTranslationsEn = {
  'Errors.BackToHome': 'Back to home',
  'Errors.Generic': 'Something went wrong',
  'Errors.GenericMessage': 'An unexpected error occurred. Please try again.',
  'Errors.NotFound': 'Page not found',
  'Errors.NotFoundMessage': 'The page you are looking for does not exist.',
  'Errors.Retry': 'Retry',
  'Errors.UnexpectedError': 'Unexpected Error',
  'Errors.UnexpectedErrorMessage': 'An unexpected error occurred. Please try again.',
} as const;
