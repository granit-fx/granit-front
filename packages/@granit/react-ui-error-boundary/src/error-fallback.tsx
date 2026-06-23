import { useTranslation } from '@granit/react-localization';
import { Button } from '@granit/react-ui';
import { AlertTriangle, Check, Copy } from 'lucide-react';
import { useState, type ComponentType, type ReactNode } from 'react';

export interface ErrorFallbackProps {
  error: Error;
  onReset: () => void;
  /** Optional wrapper (e.g. a public/centered layout). Without it the page renders bare. */
  layout?: ComponentType<{ children: ReactNode }>;
  /** Show the copyable error-detail block (typically the host's dev flag). */
  showErrorDetail?: boolean;
}

/**
 * Visible fallback for a caught render error — pair with the headless
 * `GranitErrorBoundary` from `@granit/react-error-boundary` via its
 * `renderFallback` slot.
 */
export function ErrorFallback({
  error,
  onReset,
  layout: Layout,
  showErrorDetail = false,
}: Readonly<ErrorFallbackProps>) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const errorDetail = error.toString();

  function handleCopy() {
    void navigator.clipboard.writeText(errorDetail).then(() => {
      setCopied(true);
      globalThis.setTimeout(() => setCopied(false), 2000);
    });
  }

  const content = (
    <div data-slot="error-fallback" className="text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
        <AlertTriangle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h1 className="mb-4 text-2xl font-semibold text-foreground">
        {t('Errors.UnexpectedError', 'An unexpected error occurred')}
      </h1>
      {showErrorDetail && (
        <div className="mb-6 rounded-md border border-destructive/20 bg-destructive/5 p-4 text-left">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-destructive/70">Error detail</span>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy error"
              className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-success-600 dark:text-success-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="overflow-auto text-xs text-destructive">{errorDetail}</pre>
        </div>
      )}
      <p className="mb-4 text-muted-foreground">
        {t('Errors.UnexpectedErrorMessage', 'Please try again or contact support.')}
      </p>
      <Button onClick={onReset}>{t('Errors.Retry', 'Retry')}</Button>
    </div>
  );

  return Layout ? <Layout>{content}</Layout> : content;
}
