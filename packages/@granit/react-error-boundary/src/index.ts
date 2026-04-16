export { GranitErrorBoundary } from './components/granit-error-boundary.js';
export { GlobalErrorCapture } from './components/global-error-capture.js';
export {
  ErrorContextProvider,
  useErrorBoundaryConfig,
  useErrorContext,
} from './providers/error-context-provider.js';
export { useBreadcrumb } from './hooks/use-breadcrumb.js';

export type { ErrorBoundaryProps, GlobalErrorCaptureProps } from './types/index.js';
export type { UseBreadcrumbReturn } from './hooks/use-breadcrumb.js';
