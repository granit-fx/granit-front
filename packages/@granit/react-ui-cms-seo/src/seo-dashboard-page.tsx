import { cmsSeoConstraints } from '@granit/cms-seo';
import {
  useApplySeoSuggestion,
  useRejectSeoSuggestion,
  useSeoDefaults,
  useSeoMetadataAudit,
  useSeoSuggestions,
  useUpdateSeoDefaults,
} from '@granit/react-cms-seo';
import { useTranslation } from '@granit/react-localization';
import {
  Badge,
  Button,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

import type {
  RobotsTxtRule,
  SeoSuggestionResponse,
  SeoMetadataListItem,
} from '@granit/react-cms-seo';

/** Capitalize the first letter — used to map a form field to its `cms:Seo.Fields.*` key. */
function capitalize(value: string): string {
  return value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);
}

interface SeoDefaultsFormValues {
  titleTemplate: string;
  siteName: string;
  canonicalHost: string;
  /**
   * robots.txt rules edited as text — one group per line in the form
   * `User-agent: <ua>; Allow: /a,/b; Disallow: /c; Crawl-delay: <n>`.
   * (De)serialized to/from the structured `RobotsTxtRule[]` wire shape.
   */
  robotsTxtRules: string;
}

/** Serialize a `RobotsTxtRule[]` into the textarea's one-rule-per-line format. */
function serializeRobotsTxtRules(rules: readonly RobotsTxtRule[]): string {
  return rules
    .map((rule) => {
      const parts = [`User-agent: ${rule.userAgent}`];
      if (rule.allow.length > 0) parts.push(`Allow: ${rule.allow.join(',')}`);
      if (rule.disallow.length > 0) parts.push(`Disallow: ${rule.disallow.join(',')}`);
      if (rule.crawlDelay !== null) parts.push(`Crawl-delay: ${rule.crawlDelay}`);
      return parts.join('; ');
    })
    .join('\n');
}

/** Parse the textarea's one-rule-per-line format back into `RobotsTxtRule[]`. */
function parseRobotsTxtRules(text: string): RobotsTxtRule[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      let userAgent = '*';
      const allow: string[] = [];
      const disallow: string[] = [];
      let crawlDelay: number | null = null;
      for (const segment of line.split(';')) {
        const [rawKey = '', ...rest] = segment.split(':');
        const key = rawKey.trim().toLowerCase();
        const value = rest.join(':').trim();
        if (key === 'user-agent') userAgent = value || '*';
        else if (key === 'allow')
          allow.push(
            ...value
              .split(',')
              .map((v) => v.trim())
              .filter(Boolean)
          );
        else if (key === 'disallow')
          disallow.push(
            ...value
              .split(',')
              .map((v) => v.trim())
              .filter(Boolean)
          );
        else if (key === 'crawl-delay') {
          const parsed = Number(value);
          crawlDelay = Number.isFinite(parsed) ? parsed : null;
        }
      }
      return { userAgent, allow, disallow, crawlDelay };
    });
}

function DefaultsTab({ siteId }: { readonly siteId: string }) {
  const { t } = useTranslation();
  const { data: defaults, isLoading } = useSeoDefaults(siteId);
  const updateDefaults = useUpdateSeoDefaults();

  // Spec-driven validation: messages and limits derive from the
  // `SiteSeoDefaultsRequest` contract (e.g. `canonicalHost` maxLength + the
  // `^https://` pattern). The resolver only validates fields that are both
  // registered AND present in the request schema; the UI-only textarea string
  // form of `robotsTxtRules` carries no constraint, so it is skipped.
  const formResolver = createConstraintsResolver(cmsSeoConstraints.SiteSeoDefaultsRequest, t, {
    labelResolver: (field) => t(`cms:Seo.Fields.${capitalize(field)}`, field),
  }) as unknown as Resolver<SeoDefaultsFormValues>;

  const { register, handleSubmit } = useForm<SeoDefaultsFormValues>({
    resolver: formResolver,
    values: {
      titleTemplate: defaults?.titleTemplate ?? '',
      siteName: defaults?.siteName ?? '',
      canonicalHost: defaults?.canonicalHost ?? '',
      robotsTxtRules: defaults?.robotsTxtRules
        ? serializeRobotsTxtRules(defaults.robotsTxtRules)
        : '',
    },
  });

  function onSubmit(values: SeoDefaultsFormValues) {
    const robotsTxtRules = parseRobotsTxtRules(values.robotsTxtRules);
    updateDefaults.mutate(
      {
        siteId,
        request: {
          titleTemplate: values.titleTemplate || undefined,
          siteName: values.siteName || undefined,
          canonicalHost: values.canonicalHost || undefined,
          robotsTxtRules: robotsTxtRules.length > 0 ? robotsTxtRules : undefined,
        },
      },
      {
        onSuccess: () => toast.success(t('cms:Seo.UpdateSuccess', 'SEO defaults updated.')),
      }
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('cms:Common.Loading', 'Loading…')}</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-6">
      <div className="space-y-2">
        <Label htmlFor="titleTemplate">{t('cms:Seo.Fields.TitleTemplate', 'Title template')}</Label>
        <Input
          id="titleTemplate"
          {...register('titleTemplate')}
          placeholder="{{title}} | My site"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="siteName">{t('cms:Seo.Fields.SiteName', 'Site name')}</Label>
        <Input id="siteName" {...register('siteName')} placeholder="My site" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="canonicalHost">{t('cms:Seo.Fields.CanonicalHost', 'Canonical host')}</Label>
        <Input
          id="canonicalHost"
          {...register('canonicalHost')}
          placeholder="https://example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="robotsTxtRules">
          {t('cms:Seo.Fields.RobotsTxtRules', 'robots.txt rules')}
        </Label>
        <Textarea
          id="robotsTxtRules"
          {...register('robotsTxtRules')}
          rows={6}
          className="font-mono text-xs"
          placeholder={'User-agent: *\nAllow: /'}
        />
      </div>
      <Button type="submit" disabled={updateDefaults.isPending}>
        {updateDefaults.isPending
          ? t('cms:Common.Saving', 'Saving…')
          : t('cms:Common.Save', 'Save')}
      </Button>
    </form>
  );
}

function AuditTab({ siteId }: { readonly siteId: string }) {
  const { t } = useTranslation();
  const { data: page, isLoading } = useSeoMetadataAudit({
    filters: [{ field: 'siteId', operator: 'Eq', value: siteId }],
  });
  const rows: readonly SeoMetadataListItem[] = page?.items ?? [];

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('cms:Common.Loading', 'Loading…')}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('cms:Seo.Audit.ContentType', 'Content type')}</TableHead>
          <TableHead>{t('cms:Seo.Audit.ContentId', 'Content ID')}</TableHead>
          <TableHead>{t('cms:Seo.Audit.Culture', 'Culture')}</TableHead>
          <TableHead>{t('cms:Seo.Audit.Title', 'Title')}</TableHead>
          <TableHead>{t('cms:Seo.Audit.Description', 'Description')}</TableHead>
          <TableHead>{t('cms:Seo.Audit.Canonical', 'Canonical URL')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              {t('cms:Seo.Audit.Empty', 'No metadata found.')}
            </TableCell>
          </TableRow>
        )}
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-mono text-xs">{row.contentType}</TableCell>
            <TableCell className="font-mono text-xs">{row.contentId}</TableCell>
            <TableCell>{row.culture ?? '—'}</TableCell>
            <TableCell>
              {row.title ?? (
                <Badge variant="secondary">{t('cms:Seo.Audit.Missing', 'Missing')}</Badge>
              )}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {row.description ?? (
                <Badge variant="secondary">{t('cms:Seo.Audit.Missing', 'Missing')}</Badge>
              )}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {row.canonicalUrl ?? (
                <Badge variant="secondary">{t('cms:Seo.Audit.Missing', 'Missing')}</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function AiInboxTab({ siteId }: { readonly siteId: string }) {
  const { t } = useTranslation();
  const { data: suggestions, isLoading } = useSeoSuggestions({ siteId, skip: 0, take: 50 });
  const applySuggestion = useApplySeoSuggestion();
  const rejectSuggestion = useRejectSeoSuggestion();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('cms:Common.Loading', 'Loading…')}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('cms:Seo.AiInbox.ContentId', 'Content ID')}</TableHead>
          <TableHead>{t('cms:Seo.AiInbox.Culture', 'Culture')}</TableHead>
          <TableHead>{t('cms:Seo.AiInbox.Status', 'Status')}</TableHead>
          <TableHead className="w-[100px]">{t('cms:Common.Actions', 'Actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(!suggestions?.items || suggestions.items.length === 0) && (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground">
              {t('cms:Seo.AiInbox.Empty', 'No AI suggestions pending.')}
            </TableCell>
          </TableRow>
        )}
        {suggestions?.items.map((suggestion: SeoSuggestionResponse) => (
          <TableRow key={suggestion.id}>
            <TableCell className="font-mono text-xs">{suggestion.contentId}</TableCell>
            <TableCell>{suggestion.culture}</TableCell>
            <TableCell>
              <Badge variant="secondary">{suggestion.status}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  title={t('cms:Seo.AiInbox.Apply', 'Apply')}
                  onClick={() =>
                    applySuggestion.mutate(
                      {
                        id: suggestion.id,
                        // Apply every field the suggestion covers; the server
                        // intersects this with the suggestion's own scope.
                        request: { fields: suggestion.scope },
                      },
                      {
                        onSuccess: () =>
                          toast.success(t('cms:Seo.AiInbox.ApplySuccess', 'Suggestion applied.')),
                      }
                    )
                  }
                >
                  <Check className="h-4 w-4 text-success-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title={t('cms:Seo.AiInbox.Reject', 'Reject')}
                  onClick={() =>
                    rejectSuggestion.mutate(
                      { id: suggestion.id },
                      {
                        onSuccess: () =>
                          toast.success(t('cms:Seo.AiInbox.RejectSuccess', 'Suggestion rejected.')),
                      }
                    )
                  }
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function SeoDashboardPage() {
  const { t } = useTranslation();
  const { id: siteId } = useParams<{ id: string }>();
  const [tab, setTab] = useState('defaults');
  const effectiveSiteId = siteId ?? '';

  return (
    <div data-slot="seo-dashboard-page" className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-foreground">{t('cms:Seo.Title', 'SEO')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('cms:Seo.Subtitle', 'Manage SEO defaults, audit issues, and AI suggestions.')}
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="defaults">{t('cms:Seo.Tabs.Defaults', 'Defaults')}</TabsTrigger>
          <TabsTrigger value="audit">{t('cms:Seo.Tabs.Audit', 'Audit')}</TabsTrigger>
          <TabsTrigger value="ai-inbox">{t('cms:Seo.Tabs.AiInbox', 'AI Inbox')}</TabsTrigger>
        </TabsList>
        <TabsContent value="defaults" className="mt-6">
          <DefaultsTab siteId={effectiveSiteId} />
        </TabsContent>
        <TabsContent value="audit" className="mt-6">
          <AuditTab siteId={effectiveSiteId} />
        </TabsContent>
        <TabsContent value="ai-inbox" className="mt-6">
          <AiInboxTab siteId={effectiveSiteId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
