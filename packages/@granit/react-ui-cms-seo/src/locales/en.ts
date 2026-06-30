// @granit/react-ui-cms-seo — English resource bundle (flat keys, "translation" ns).
// Keys keep the literal `cms:` prefix used by the showcase fixtures (it is part of
// the flat key, NOT an i18next namespace).
// Register in the host app:
//   import { cmsSeoTranslationsEn } from "@granit/react-ui-cms-seo";
//   i18n.addResourceBundle("en", "translation", cmsSeoTranslationsEn, true, true);

export const cmsSeoTranslationsEn = {
  'cms:Seo.AiInbox.Apply': 'Apply',
  'cms:Seo.AiInbox.ApplyError': 'Failed to apply.',
  'cms:Seo.AiInbox.ApplySuccess': 'Suggestion applied.',
  'cms:Seo.AiInbox.ContentId': 'Content ID',
  'cms:Seo.AiInbox.Culture': 'Culture',
  'cms:Seo.AiInbox.Empty': 'No AI suggestions pending.',
  'cms:Seo.AiInbox.Reject': 'Reject',
  'cms:Seo.AiInbox.RejectError': 'Failed to reject.',
  'cms:Seo.AiInbox.RejectSuccess': 'Suggestion rejected.',
  'cms:Seo.AiInbox.Status': 'Status',
  'cms:Seo.Audit.Canonical': 'Canonical URL',
  'cms:Seo.Audit.ContentId': 'Content ID',
  'cms:Seo.Audit.ContentType': 'Content type',
  'cms:Seo.Audit.Culture': 'Culture',
  'cms:Seo.Audit.Description': 'Description',
  'cms:Seo.Audit.Missing': 'Missing',
  'cms:Seo.Audit.QuickFilter.MissingDescription': 'Missing description',
  'cms:Seo.Audit.QuickFilter.MissingOgImage': 'Missing OG image',
  'cms:Seo.Audit.QuickFilter.NoCanonical': 'No canonical',
  'cms:Seo.Audit.QuickFilter.TitleTooLong': 'Title too long',
  'cms:Seo.Audit.Title': 'Title',
  'cms:Seo.Fields.CanonicalHost': 'Canonical host',
  'cms:Seo.Fields.RobotsTxtRules': 'robots.txt rules',
  'cms:Seo.Fields.SiteName': 'Site name',
  'cms:Seo.Fields.TitleTemplate': 'Title template',
  'cms:Seo.Subtitle': 'Manage SEO defaults, audit issues, and AI suggestions.',
  'cms:Seo.Tabs.AiInbox': 'AI Inbox',
  'cms:Seo.Tabs.Audit': 'Audit',
  'cms:Seo.Tabs.Defaults': 'Defaults',
  'cms:Seo.Title': 'SEO',
  'cms:Seo.UpdateError': 'Failed to update SEO defaults.',
  'cms:Seo.UpdateSuccess': 'SEO defaults updated.',
} as const;

export type CmsSeoTranslations = typeof cmsSeoTranslationsEn;
