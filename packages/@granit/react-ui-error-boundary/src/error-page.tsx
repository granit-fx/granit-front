import { useTranslation } from '@granit/react-localization';
import { Button } from '@granit/react-ui';
import { AlertTriangle, Check, Copy, ServerCrash } from 'lucide-react';
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';

export interface ErrorPageProps {
  /** Optional wrapper (e.g. a public/centered layout). Without it the page renders bare. */
  layout?: ComponentType<{ children: ReactNode }>;
  /** Called once with the caught route error so the host can log it. */
  onError?: (error: unknown) => void;
  /** Show the copyable error-detail block (typically the host's dev flag). */
  showErrorDetail?: boolean;
}

function resolveErrorDetail(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (isRouteErrorResponse(error)) return error.statusText;
  if (error === null || error === undefined) return '';
  if (typeof error === 'object') return JSON.stringify(error);
  return String(error);
}

/**
 * React Router `errorElement` — distinguishes a 404 from other route errors and
 * links back home. Pass `onError` to log via the host's logger.
 */
export function ErrorPage({
  layout: Layout,
  onError,
  showErrorDetail = false,
}: Readonly<ErrorPageProps>) {
  const { t } = useTranslation();
  const error = useRouteError();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (error) onError?.(error);
  }, [error, onError]);

  const isNotFound = isRouteErrorResponse(error) && error.status === 404;
  const Icon = isNotFound ? AlertTriangle : ServerCrash;
  const title = isNotFound ? t('Errors.NotFound') : t('Errors.Generic');
  const message = isNotFound ? t('Errors.NotFoundMessage') : t('Errors.GenericMessage');

  const errorDetail = resolveErrorDetail(error);

  function handleCopy() {
    void navigator.clipboard.writeText(errorDetail).then(() => {
      setCopied(true);
      globalThis.setTimeout(() => setCopied(false), 2000);
    });
  }

  const content = (
    <div data-slot="error-page" className="text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
        <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h1 className="mb-4 text-2xl font-semibold text-foreground">{title}</h1>
      {showErrorDetail && errorDetail && (
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
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="overflow-auto text-sm text-destructive">{errorDetail}</pre>
        </div>
      )}
      <p className="mb-8 text-muted-foreground">{message}</p>
      <Button asChild>
        <Link to="/">{t('Errors.BackToHome')}</Link>
      </Button>
    </div>
  );

  return Layout ? <Layout>{content}</Layout> : content;
}
