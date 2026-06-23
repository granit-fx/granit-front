import { useTranslation } from '@granit/react-localization';
import { useTemplateCategories } from '@granit/react-templating';
import { Card, CardContent, Skeleton } from '@granit/react-ui';
import { TemplateLifecycleStatus } from '@granit/templating';
import { FileText, FolderOpen, PenLine, Send } from 'lucide-react';

interface TemplateDashboardProps {
  items?: ReadonlyArray<{ currentStatus?: number }>;
  isLoading?: boolean;
}

export function TemplateDashboard({ items, isLoading }: Readonly<TemplateDashboardProps>) {
  const { t } = useTranslation();
  const { data: categories } = useTemplateCategories();

  if (isLoading) {
    return (
      <div data-slot="template-dashboard" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={`skeleton-${i}`} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const total = items?.length ?? 0;
  const drafts =
    items?.filter((i) => i.currentStatus === TemplateLifecycleStatus.Draft).length ?? 0;
  const published =
    items?.filter((i) => i.currentStatus === TemplateLifecycleStatus.Published).length ?? 0;
  const categoryCount = categories?.length ?? 0;

  const stats = [
    {
      label: t('Templates.Dashboard.Total'),
      value: total,
      icon: FileText,
      color: 'text-foreground',
    },
    {
      label: t('Templates.Dashboard.Drafts'),
      value: drafts,
      icon: PenLine,
      color: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: t('Templates.Dashboard.Published'),
      value: published,
      icon: Send,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      label: t('Templates.Dashboard.Categories'),
      value: categoryCount,
      icon: FolderOpen,
      color: 'text-blue-600 dark:text-blue-400',
    },
  ];

  return (
    <div data-slot="template-dashboard" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-4 p-4">
            <stat.icon className={`h-8 w-8 ${stat.color}`} />
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
