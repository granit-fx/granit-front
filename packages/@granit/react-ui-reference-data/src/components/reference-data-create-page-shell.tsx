import { useTranslation } from '@granit/react-localization';
import { Button, Separator } from '@granit/react-ui';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { ReactNode } from 'react';

interface ReferenceDataCreatePageShellProps {
  readonly i18nPrefix: string;
  readonly basePath: string;
  /** The form component to render. */
  readonly children: ReactNode;
}

export function ReferenceDataCreatePageShell({
  i18nPrefix,
  basePath,
  children,
}: ReferenceDataCreatePageShellProps) {
  const { t } = useTranslation();

  return (
    <div data-slot="reference-data-create-page" className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={basePath}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t(`${i18nPrefix}.Detail.BackToList`)}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-2xl font-semibold text-foreground">
          {t(`${i18nPrefix}.Detail.CreateTitle`)}
        </h2>
      </div>

      {/* Form */}
      {children}
    </div>
  );
}
