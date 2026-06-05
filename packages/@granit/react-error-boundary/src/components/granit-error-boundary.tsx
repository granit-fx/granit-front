import * as React from 'react';

import { collectErrorContext, ErrorContext } from '../providers/error-context-provider';

import type { ErrorBoundaryProps } from '../types/index';
import type { Logger } from '@granit/logger';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

type ErrorBoundaryState = {
  error: Error | null;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Headless React error boundary that catches rendering errors,
 * logs them via `@granit/logger`, and delegates UI to `renderFallback`.
 *
 * @example
 * ```tsx
 * <GranitErrorBoundary
 *   logger={logger}
 *   renderFallback={(error, reset) => (
 *     <div>
 *       <p>Something went wrong: {error.message}</p>
 *       <button onClick={reset}>Try again</button>
 *     </div>
 *   )}
 * >
 *   <App />
 * </GranitErrorBoundary>
 * ```
 */
export class GranitErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static contextType = ErrorContext;
  declare context: React.ContextType<typeof ErrorContext>;

  private readonly logger: Logger;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
    this.logger = props.logger;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.logger.error('Uncaught render error', error, {
      componentStack: errorInfo.componentStack ?? undefined,
      ...collectErrorContext(this.context),
    });

    this.props.onError?.(error, errorInfo);
  }

  private readonly resetErrorBoundary = () => {
    this.setState({ error: null });
  };

  override render(): React.ReactNode {
    if (this.state.error) {
      return (
        <div data-testid="error-boundary-fallback">
          {this.props.renderFallback(this.state.error, this.resetErrorBoundary)}
        </div>
      );
    }

    return this.props.children;
  }
}
