export { GranitErrorBoundary } from './components/granit-error-boundary';
export { GlobalErrorCapture } from './components/global-error-capture';
export {
  ErrorContextProvider,
  useErrorBoundaryConfig,
  useErrorContext,
} from './providers/error-context-provider';
export { useBreadcrumb } from './hooks/use-breadcrumb';

export type { ErrorBoundaryProps, GlobalErrorCaptureProps } from './types/index';
export type { UseBreadcrumbReturn } from './hooks/use-breadcrumb';
