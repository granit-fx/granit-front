import * as React from 'react';

import { useErrorBoundaryConfig } from '../providers/error-context-provider';

/** Return type of the {@link useBreadcrumb} hook. */
export type UseBreadcrumbReturn = {
  /** Add a breadcrumb to the error context trail. */
  addBreadcrumb: (category: string, message: string) => void;
};

/**
 * Hook for adding breadcrumbs to the error context.
 *
 * Requires an `ErrorContextProvider` ancestor in the component tree.
 *
 * @example
 * ```tsx
 * const { addBreadcrumb } = useBreadcrumb();
 *
 * const handleClick = () => {
 *   addBreadcrumb('user', 'Clicked save button');
 *   save();
 * };
 * ```
 */
export function useBreadcrumb(): UseBreadcrumbReturn {
  const { addBreadcrumb } = useErrorBoundaryConfig();

  return React.useMemo(() => ({ addBreadcrumb }), [addBreadcrumb]);
}
