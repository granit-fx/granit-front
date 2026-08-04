import { useTranslation } from '@granit/react-localization';
import { Button } from '@granit/react-ui';
import { AlertTriangle } from 'lucide-react';
import { type ComponentType, type ReactNode } from 'react';
import { Link } from 'react-router';

export interface NotFoundPageProps {
  /** Optional wrapper (e.g. a public/centered layout). Without it the page renders bare. */
  layout?: ComponentType<{ children: ReactNode }>;
}

/** Standalone 404 page. */
export function NotFoundPage({ layout: Layout }: Readonly<NotFoundPageProps>) {
  const { t } = useTranslation();

  const content = (
    <div
      data-slot="not-found-page"
      className="flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center px-4"
    >
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
          <AlertTriangle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-foreground">{t('Errors.NotFound')}</h1>
        <p className="mb-8 text-muted-foreground">{t('Errors.NotFoundMessage')}</p>
        <Button asChild>
          <Link to="/">{t('Errors.BackToHome')}</Link>
        </Button>
      </div>
    </div>
  );

  return Layout ? <Layout>{content}</Layout> : content;
}
